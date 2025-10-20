/**
 * Import Plan Modal - Phase 6.1
 *
 * Modal for importing show plans from Abe I Stream
 */

import { useState, useEffect, useRef } from 'react';
import { Upload, X, CheckCircle, AlertTriangle, FileText, Clock, Target, Users } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../contexts/AuthContext';
import type {
  AbeStreamExport,
  ParsedPlan,
  ValidationError,
  ImportResult
} from '../types/show-plan-import';

interface ImportPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (showId: string) => void;
}

export function ImportPlanModal({ isOpen, onClose, onSuccess }: ImportPlanModalProps) {
  const { hostId } = useAuth();
  const [jsonInput, setJsonInput] = useState('');
  const [parsedPlan, setParsedPlan] = useState<ParsedPlan | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [clipboardError, setClipboardError] = useState<string | null>(null);

  // Refs for focus management
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Ref to prevent race condition on rapid button clicks
  const isImportingRef = useRef(false);

  // Initialize Supabase client
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL || '',
    import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  );

  // Keyboard shortcuts: Esc to close, Cmd/Ctrl+Enter to import
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key - close modal
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Cmd/Ctrl+Enter - trigger import (when valid input exists)
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (jsonInput.trim() && !isImporting && !isValidating && !importResult?.success) {
          handleImport();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, jsonInput, isImporting, isValidating, importResult, onClose]);

  // Focus management and focus trap
  useEffect(() => {
    if (!isOpen) return;

    // Save previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus first focusable element in modal
    const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements && focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Trap focus within modal
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: if focused on first element, move to last
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab: if focused on last element, move to first
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);

    // Restore focus when modal closes
    return () => {
      document.removeEventListener('keydown', handleTabKey);
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  /**
   * Validate JSON structure
   * Note: Strings are stored raw in database - React handles XSS prevention at render time
   */
  const validatePlan = (input: string): ParsedPlan => {
    const errors: ValidationError[] = [];

    try {
      // Check input size (max 1MB)
      if (input.length > 1024 * 1024) {
        errors.push({
          field: 'json',
          message: 'Input too large (max 1MB)',
          severity: 'error'
        });
        return { data: null, isValid: false, errors };
      }

      // Parse JSON
      const data = JSON.parse(input) as AbeStreamExport;

      // Validate required fields
      if (!data.showId) {
        errors.push({ field: 'showId', message: 'Missing show ID', severity: 'error' });
      } else {
        // Trim whitespace from showId
        data.showId = data.showId.trim();

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(data.showId)) {
          errors.push({
            field: 'showId',
            message: 'Invalid UUID format - show ID must be a valid UUID',
            severity: 'error'
          });
        }

        if (data.showId.length > 100) {
          errors.push({ field: 'showId', message: 'Show ID too long (max 100 chars)', severity: 'error' });
        }
      }

      if (!data.segments || !Array.isArray(data.segments)) {
        errors.push({ field: 'segments', message: 'Missing or invalid segments array', severity: 'error' });
      } else if (data.segments.length === 0) {
        errors.push({ field: 'segments', message: 'At least one segment is required', severity: 'error' });
      } else if (data.segments.length > 50) {
        errors.push({ field: 'segments', message: 'Too many segments (max 50)', severity: 'error' });
      } else {
        let totalQuestions = 0;

        // Validate each segment
        data.segments.forEach((seg, idx) => {
          if (!seg.id) {
            errors.push({ field: `segments[${idx}].id`, message: 'Missing segment ID', severity: 'error' });
          } else {
            seg.id = seg.id.trim();
          }

          if (!seg.name) {
            errors.push({ field: `segments[${idx}].name`, message: 'Missing segment name', severity: 'error' });
          } else if (seg.name.length > 200) {
            errors.push({ field: `segments[${idx}].name`, message: 'Segment name too long (max 200 chars)', severity: 'error' });
          } else {
            seg.name = seg.name.trim();
          }

          if (!seg.description) {
            seg.description = '';
          } else if (seg.description.length > 1000) {
            errors.push({ field: `segments[${idx}].description`, message: 'Description too long (max 1000 chars)', severity: 'warning' });
            seg.description = seg.description.substring(0, 1000).trim();
          } else {
            seg.description = seg.description.trim();
          }

          if (seg.duration <= 0) {
            errors.push({ field: `segments[${idx}].duration`, message: 'Invalid duration', severity: 'error' });
          } else if (seg.duration > 180) {
            errors.push({ field: `segments[${idx}].duration`, message: 'Segment duration too long (max 180 min)', severity: 'error' });
          }

          if (!seg.questions || seg.questions.length === 0) {
            errors.push({ field: `segments[${idx}].questions`, message: 'No questions in segment', severity: 'warning' });
          } else if (seg.questions.length > 100) {
            errors.push({ field: `segments[${idx}].questions`, message: 'Too many questions in segment (max 100)', severity: 'error' });
          } else {
            totalQuestions += seg.questions.length;

            // Validate questions
            seg.questions.forEach((q, qIdx) => {
              if (!q.id) {
                errors.push({ field: `segments[${idx}].questions[${qIdx}].id`, message: 'Missing question ID', severity: 'warning' });
              } else {
                q.id = q.id.trim();
              }

              if (!q.text) {
                errors.push({ field: `segments[${idx}].questions[${qIdx}].text`, message: 'Missing question text', severity: 'error' });
              } else if (q.text.length > 500) {
                errors.push({ field: `segments[${idx}].questions[${qIdx}].text`, message: 'Question text too long (max 500 chars)', severity: 'error' });
              } else {
                q.text = q.text.trim();
              }

              if (q.estimatedDuration && q.estimatedDuration > 60) {
                errors.push({ field: `segments[${idx}].questions[${qIdx}].estimatedDuration`, message: 'Question duration too long (max 60 min)', severity: 'warning' });
              }
            });
          }
        });

        // Validate total question count
        if (totalQuestions > 500) {
          errors.push({ field: 'segments', message: 'Too many total questions (max 500)', severity: 'error' });
        }
      }

      if (!data.totalDuration || data.totalDuration <= 0) {
        errors.push({ field: 'totalDuration', message: 'Invalid total duration', severity: 'error' });
      } else if (data.totalDuration > 480) {
        errors.push({ field: 'totalDuration', message: 'Total duration too long (max 480 min / 8 hours)', severity: 'error' });
      }

      if (!data.metadata?.source || data.metadata.source !== 'abe_stream') {
        errors.push({ field: 'metadata.source', message: 'Invalid source - must be from Abe I Stream', severity: 'error' });
      }

      // Trim and validate metadata fields
      if (data.metadata) {
        if (data.metadata.title) {
          if (data.metadata.title.length > 300) {
            errors.push({ field: 'metadata.title', message: 'Title too long (max 300 chars)', severity: 'warning' });
            data.metadata.title = data.metadata.title.substring(0, 300).trim();
          } else {
            data.metadata.title = data.metadata.title.trim();
          }
        }

        if (data.metadata.format) {
          if (data.metadata.format.length > 100) {
            errors.push({ field: 'metadata.format', message: 'Format too long (max 100 chars)', severity: 'warning' });
            data.metadata.format = data.metadata.format.substring(0, 100).trim();
          } else {
            data.metadata.format = data.metadata.format.trim();
          }
        }

        if (data.metadata.hook) {
          if (data.metadata.hook.length > 1000) {
            errors.push({ field: 'metadata.hook', message: 'Hook too long (max 1000 chars)', severity: 'warning' });
            data.metadata.hook = data.metadata.hook.substring(0, 1000).trim();
          } else {
            data.metadata.hook = data.metadata.hook.trim();
          }
        }

        if (data.metadata.throughline) {
          if (data.metadata.throughline.length > 1000) {
            errors.push({ field: 'metadata.throughline', message: 'Throughline too long (max 1000 chars)', severity: 'warning' });
            data.metadata.throughline = data.metadata.throughline.substring(0, 1000).trim();
          } else {
            data.metadata.throughline = data.metadata.throughline.trim();
          }
        }

        if (data.metadata.panelists && Array.isArray(data.metadata.panelists)) {
          if (data.metadata.panelists.length > 20) {
            errors.push({ field: 'metadata.panelists', message: 'Too many panelists (max 20)', severity: 'error' });
            data.metadata.panelists = data.metadata.panelists.slice(0, 20);
          }
          data.metadata.panelists = data.metadata.panelists.map(p => {
            if (p.length > 100) {
              return p.substring(0, 100).trim();
            }
            return p.trim();
          });
        }
      }

      if (!data.predictedEngagementCurve) {
        errors.push({ field: 'predictedEngagementCurve', message: 'Missing engagement curve', severity: 'warning' });
      }

      const hasErrors = errors.some(e => e.severity === 'error');

      return {
        data: hasErrors ? null : data,
        isValid: !hasErrors,
        errors
      };
    } catch (error) {
      return {
        data: null,
        isValid: false,
        errors: [{
          field: 'json',
          message: `Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error'
        }]
      };
    }
  };

  /**
   * Handle paste button click
   * Note: Validation moved to Import button - no validation on paste
   */
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJsonInput(text);
      // Clear previous validation state and errors
      setParsedPlan(null);
      setImportResult(null);
      setClipboardError(null);
    } catch (error) {
      console.error('Failed to read clipboard:', error);
      setClipboardError('Failed to read from clipboard. Please paste manually using Ctrl/Cmd+V.');
      // Auto-clear error after 5 seconds
      setTimeout(() => setClipboardError(null), 5000);
    }
  };

  /**
   * Handle manual input change
   * Note: Validation moved to Import button - no validation on input
   */
  const handleInputChange = (value: string) => {
    setJsonInput(value);
    // Clear previous validation state when input changes
    setParsedPlan(null);
    setImportResult(null);
    setClipboardError(null);
  };

  /**
   * Import plan to Supabase
   * Note: Validation runs here on Import button click only
   */
  const handleImport = async () => {
    // Prevent race condition: check if import is already in progress
    if (isImportingRef.current) {
      return;
    }

    // Set guard flag immediately (synchronous)
    isImportingRef.current = true;

    // Run validation first
    setIsValidating(true);
    const validationResult = validatePlan(jsonInput);
    setParsedPlan(validationResult);
    setIsValidating(false);

    // Check if validation passed
    if (!validationResult.data || !validationResult.isValid) {
      isImportingRef.current = false; // Reset guard on validation failure
      return; // Validation errors will be displayed via parsedPlan state
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const plan = validationResult.data;

      // Insert into show_plans table
      const { data, error } = await supabase
        .from('show_plans')
        .insert({
          show_id: plan.showId,
          host_id: hostId,
          segments: plan.segments,
          total_duration: plan.totalDuration,
          predicted_engagement_curve: plan.predictedEngagementCurve,
          original_plan: plan.originalPlan,
          current_plan: plan.currentPlan,
          metadata: plan.metadata,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setImportResult({
        success: true,
        showId: plan.showId,
        message: 'Show plan imported successfully!'
      });

      // Call success callback after 1.5 seconds
      setTimeout(() => {
        onSuccess(plan.showId);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        success: false,
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    } finally {
      setIsImporting(false);
      isImportingRef.current = false; // Reset guard flag
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
      aria-describedby="import-modal-description"
    >
      <div ref={modalRef} className="bg-gray-900 border-2 border-indigo-600 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex items-start justify-between">
          <div>
            <h2 id="import-modal-title" className="text-2xl font-bold text-white flex items-center gap-3">
              <Upload className="w-6 h-6 text-indigo-400" aria-hidden="true" />
              Import Show Plan
            </h2>
            <p id="import-modal-description" className="text-sm text-gray-400 mt-1">
              Paste JSON from Abe I Stream to import a pre-planned show
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close import modal"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Input Area */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="plan-json-input" className="text-sm font-semibold text-gray-300">
                Show Plan JSON
              </label>
              <button
                onClick={handlePaste}
                className="text-xs px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors flex items-center gap-1"
                aria-label="Paste JSON from clipboard"
              >
                <FileText className="w-3 h-3" aria-hidden="true" />
                Paste from Clipboard
              </button>
            </div>
            <textarea
              id="plan-json-input"
              value={jsonInput}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder='Paste your show plan JSON here...'
              className="w-full h-48 bg-black border border-gray-700 rounded p-3 text-gray-300 font-mono text-xs resize-none focus:border-indigo-500 focus:outline-none"
              aria-invalid={parsedPlan && !parsedPlan.isValid ? 'true' : 'false'}
              aria-describedby={parsedPlan && !parsedPlan.isValid ? 'validation-errors' : undefined}
            />
          </div>

          {/* Clipboard Error */}
          {clipboardError && (
            <div
              className="bg-yellow-900/20 border border-yellow-500/50 rounded p-3 flex items-center gap-2"
              role="alert"
              aria-live="polite"
            >
              <AlertTriangle className="w-4 h-4 text-yellow-400" aria-hidden="true" />
              <span className="text-sm text-yellow-300">{clipboardError}</span>
            </div>
          )}

          {/* Validation Status */}
          {isValidating && (
            <div
              className="bg-blue-900/20 border border-blue-500/50 rounded p-3 flex items-center gap-2"
              role="status"
              aria-live="polite"
            >
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
              <span className="text-sm text-blue-300">Validating...</span>
            </div>
          )}

          {/* Validation Errors */}
          {parsedPlan && !parsedPlan.isValid && (
            <div
              id="validation-errors"
              className="bg-red-900/20 border border-red-500/50 rounded p-4"
              role="alert"
              aria-live="assertive"
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-400" aria-hidden="true" />
                <h3 className="font-semibold text-red-300">Validation Failed</h3>
              </div>
              <div className="space-y-2">
                {parsedPlan.errors.map((error, idx) => (
                  <div key={idx} className="text-sm text-red-300 flex items-start gap-2">
                    <span className="text-red-400" aria-hidden="true">•</span>
                    <span>
                      <strong>{error.field}:</strong> {error.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plan Preview */}
          {parsedPlan?.isValid && parsedPlan.data && (
            <div className="bg-green-900/20 border border-green-500/50 rounded p-4">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <h3 className="font-semibold text-green-300">Valid Show Plan</h3>
              </div>

              {/* Plan Summary */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-black/30 rounded p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs text-gray-400">Segments</span>
                  </div>
                  <p className="text-lg font-bold text-white">
                    {parsedPlan.data.segments.length}
                  </p>
                </div>
                <div className="bg-black/30 rounded p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-gray-400">Duration</span>
                  </div>
                  <p className="text-lg font-bold text-white">
                    {parsedPlan.data.totalDuration} min
                  </p>
                </div>
                <div className="bg-black/30 rounded p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-gray-400">Questions</span>
                  </div>
                  <p className="text-lg font-bold text-white">
                    {parsedPlan.data.segments.reduce((sum, seg) => sum + seg.questions.length, 0)}
                  </p>
                </div>
              </div>

              {/* Metadata */}
              <div className="bg-black/30 rounded p-3 space-y-2 text-sm">
                <div>
                  <span className="text-gray-400">Title:</span>
                  <span className="text-white ml-2 font-medium">{parsedPlan.data.metadata.title}</span>
                </div>
                <div>
                  <span className="text-gray-400">Format:</span>
                  <span className="text-white ml-2">{parsedPlan.data.metadata.format}</span>
                </div>
                {parsedPlan.data.metadata.panelists && parsedPlan.data.metadata.panelists.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <span className="text-gray-400">Panelists:</span>
                      <div className="text-white ml-2">
                        {parsedPlan.data.metadata.panelists.join(', ')}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Warnings */}
              {parsedPlan.errors.length > 0 && (
                <div className="mt-3 space-y-1">
                  {parsedPlan.errors.map((error, idx) => (
                    <div key={idx} className="text-xs text-yellow-400 flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 mt-0.5" />
                      <span>{error.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div
              className={`border rounded p-4 ${
                importResult.success
                  ? 'bg-green-900/20 border-green-500/50'
                  : 'bg-red-900/20 border-red-500/50'
              }`}
              role={importResult.success ? 'status' : 'alert'}
              aria-live={importResult.success ? 'polite' : 'assertive'}
            >
              <div className="flex items-center gap-2">
                {importResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-400" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-400" aria-hidden="true" />
                )}
                <span className={`font-semibold ${
                  importResult.success ? 'text-green-300' : 'text-red-300'
                }`}>
                  {importResult.message}
                </span>
              </div>
              {importResult.errors && (
                <div className="mt-2 space-y-1">
                  {importResult.errors.map((error, idx) => (
                    <div key={idx} className="text-xs text-red-300"><span aria-hidden="true">• </span>{error}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!jsonInput.trim() || isImporting || isValidating || importResult?.success}
            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center justify-center gap-2"
          >
            {isImporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Importing...
              </>
            ) : importResult?.success ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Imported
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Import Plan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
