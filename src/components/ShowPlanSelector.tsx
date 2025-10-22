/**
 * Show Plan Selector - Phase 6.1
 *
 * Displays saved show plans and allows selection
 */

import { useState, useEffect } from 'react';
import { FileText, Clock, Target, Calendar, CheckCircle, Loader2, Search, Filter } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../contexts/AuthContext';
import type { SavedShowPlan, PlanOption } from '../types/show-plan-import';

interface ShowPlanSelectorProps {
  selectedPlanId?: string;
  onSelect: (plan: SavedShowPlan) => void;
  className?: string;
}

export function ShowPlanSelector({ selectedPlanId, onSelect, className = '' }: ShowPlanSelectorProps) {
  const { hostId } = useAuth();
  const [plans, setPlans] = useState<SavedShowPlan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<SavedShowPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'duration' | 'title'>('date');

  // Initialize Supabase client
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL || '',
    import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  );

  /**
   * Load plans from Supabase
   */
  const loadPlans = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('show_plans')
        .select('*, plan_effectiveness as effectiveness_score')
        .eq('host_id', hostId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setPlans((data as unknown as SavedShowPlan[]) || []);
      setFilteredPlans((data as unknown as SavedShowPlan[]) || []);
    } catch (err) {
      console.error('Error loading plans:', err);
      setError(err instanceof Error ? err.message : 'Failed to load plans');
    } finally {
      setIsLoading(false);
    }
  };

  // Load plans on mount
  useEffect(() => {
    loadPlans();
  }, [hostId]);

  /**
   * Filter and sort plans
   */
  useEffect(() => {
    let filtered = [...plans];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(plan =>
        plan.metadata?.title?.toLowerCase().includes(query) ||
        plan.metadata?.format?.toLowerCase().includes(query) ||
        plan.show_id.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'duration':
          return b.total_duration - a.total_duration;
        case 'title':
          return (a.metadata?.title || '').localeCompare(b.metadata?.title || '');
        default:
          return 0;
      }
    });

    setFilteredPlans(filtered);
  }, [plans, searchQuery, sortBy]);

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  /**
   * Get plan option data
   */
  const getPlanOption = (plan: SavedShowPlan): PlanOption => ({
    id: plan.id,
    title: plan.metadata?.title || 'Untitled Show',
    format: plan.metadata?.format || 'Unknown',
    duration: plan.total_duration,
    createdAt: plan.created_at,
    segmentCount: plan.segments?.length || 0,
    questionCount: plan.segments?.reduce((sum, seg) => sum + (seg.questions?.length || 0), 0) || 0
  });

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-400">Loading show plans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-900/20 border border-red-500/50 rounded-lg p-6 ${className}`}>
        <p className="text-red-300 text-center">
          Error loading plans: {error}
        </p>
        <button
          onClick={loadPlans}
          className="mt-3 mx-auto block text-sm px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header with Search and Sort */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plans..."
              className="w-full pl-10 pr-4 py-2 bg-black border border-gray-700 rounded text-sm text-gray-300 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'duration' | 'title')}
              className="bg-black border border-gray-700 rounded px-3 py-2 text-sm text-gray-300 focus:border-indigo-500 focus:outline-none"
            >
              <option value="date">Latest first</option>
              <option value="duration">Duration</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{filteredPlans.length} plan{filteredPlans.length !== 1 ? 's' : ''} found</span>
          <button
            onClick={loadPlans}
            className="text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Plans List */}
      {filteredPlans.length === 0 ? (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-12 text-center">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">
            {searchQuery ? 'No plans match your search' : 'No show plans yet'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {searchQuery ? 'Try a different search term' : 'Import a plan from Abe I Stream to get started'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPlans.map((plan) => {
            const option = getPlanOption(plan);
            const isSelected = selectedPlanId === plan.id;

            return (
              <button
                key={plan.id}
                onClick={() => onSelect(plan)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'bg-indigo-900/30 border-indigo-500'
                    : 'bg-gray-900 border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Selection Indicator */}
                  <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-colors ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500'
                      : 'border-gray-600'
                  }`}>
                    {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>

                  {/* Plan Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold truncate">
                          {option.title}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {option.format}
                        </p>
                      </div>
                      {plan.effectiveness_score && (
                        <div className="flex-shrink-0 text-xs px-2 py-1 bg-green-900/30 border border-green-500/30 text-green-300 rounded">
                          {(plan.effectiveness_score * 100).toFixed(0)}% effective
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        <span>{option.segmentCount} segments</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>{option.questionCount} questions</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{option.duration} min</span>
                      </div>
                      <div className="flex items-center gap-1 ml-auto">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(option.createdAt)}</span>
                      </div>
                    </div>

                    {/* Panelists */}
                    {plan.metadata?.panelists && plan.metadata.panelists.length > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-gray-500">With:</span>
                        <div className="flex flex-wrap gap-1">
                          {plan.metadata.panelists.map((panelist, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-0.5 bg-gray-800 text-gray-300 rounded"
                            >
                              {panelist}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
