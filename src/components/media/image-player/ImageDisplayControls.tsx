import { ChevronLeft, ChevronRight, EyeOff, AlertTriangle } from 'lucide-react';
import { ImageQueueItem, TransitionEffect } from '@/types/video';

interface ImageDisplayControlsProps {
  currentImage: ImageQueueItem | null;
  isDisplayed: boolean;
  transition: TransitionEffect;
  autoAdvance: boolean;
  autoAdvanceInterval: number;
  onPrevious: () => void;
  onNext: () => void;
  onHide: () => void;
  onHideAll: () => void;
  onTransitionChange: (transition: TransitionEffect) => void;
  onAutoAdvanceChange: (enabled: boolean) => void;
  onIntervalChange: (interval: number) => void;
}

const TRANSITIONS: { value: TransitionEffect; label: string }[] = [
  { value: 'instant', label: 'Instant' },
  { value: 'fade', label: 'Fade' },
  { value: 'slide-left', label: 'Slide Left' },
  { value: 'slide-right', label: 'Slide Right' },
  { value: 'zoom-in', label: 'Zoom In' }
];

const INTERVALS = [5, 10, 15, 30, 60];

export function ImageDisplayControls({
  currentImage,
  isDisplayed,
  transition,
  autoAdvance,
  autoAdvanceInterval,
  onPrevious,
  onNext,
  onHide,
  onHideAll,
  onTransitionChange,
  onAutoAdvanceChange,
  onIntervalChange
}: ImageDisplayControlsProps) {
  return (
    <div className="bg-white rounded-lg shadow-card p-4 space-y-4">
      <h2 className="text-lg font-bold text-neutral-900">Display Controls</h2>

      {/* Now Showing Section */}
      {isDisplayed && currentImage ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 bg-accent-500 text-neutral-900 rounded text-xs font-bold">
              LIVE
            </div>
            <span className="text-sm font-semibold text-neutral-900">Now Showing</span>
          </div>

          <img
            src={currentImage.file_path}
            alt={currentImage.filename}
            className="w-full rounded-md"
          />

          <div>
            <p className="text-sm font-semibold text-neutral-900 truncate">
              {currentImage.filename}
            </p>
            {currentImage.caption && (
              <p className="text-xs text-neutral-600 line-clamp-2">
                {currentImage.caption}
              </p>
            )}
          </div>

          <button
            onClick={onHide}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-md font-medium transition-colors"
          >
            <EyeOff className="w-4 h-4" />
            Hide Image
          </button>
        </div>
      ) : (
        <div className="py-8 text-center text-neutral-600">
          <EyeOff className="w-12 h-12 mx-auto mb-2 text-neutral-400" />
          <p className="text-sm">No image displayed</p>
        </div>
      )}

      {/* Navigation Controls */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-neutral-900">Navigation</p>
        <div className="flex gap-2">
          <button
            onClick={onPrevious}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-md transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>
          <button
            onClick={onNext}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-md transition-colors"
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Auto-Advance */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={autoAdvance}
            onChange={(e) => onAutoAdvanceChange(e.target.checked)}
            className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
          />
          <span className="text-sm font-medium text-neutral-900">Auto-Advance</span>
        </label>

        {autoAdvance && (
          <select
            value={autoAdvanceInterval}
            onChange={(e) => onIntervalChange(Number(e.target.value))}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {INTERVALS.map(interval => (
              <option key={interval} value={interval}>
                {interval}s
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Transition Effects */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-neutral-900">
          Transition Effect
        </label>
        <select
          value={transition}
          onChange={(e) => onTransitionChange(e.target.value as TransitionEffect)}
          className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {TRANSITIONS.map(t => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Emergency Controls */}
      <div className="pt-3 border-t border-neutral-200">
        <button
          onClick={onHideAll}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-error-500 hover:bg-error-600 text-white rounded-md font-bold transition-colors"
        >
          <AlertTriangle className="w-5 h-5" />
          HIDE ALL
        </button>
      </div>
    </div>
  );
}
