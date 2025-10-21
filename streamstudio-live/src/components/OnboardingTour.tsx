import React, { useState, useEffect } from 'react';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to StreamStudio Live!',
    description: "Let's take a quick tour to help you get started with your AI DJ system.",
  },
  {
    id: 'library',
    title: 'Music Library',
    description: 'Upload your music files here. Each track will be automatically analyzed for BPM, key, and energy level.',
  },
  {
    id: 'presets',
    title: 'Quick Presets',
    description: 'Choose a preset mode for instant Auto-DJ setup. Morning Calm, Work Focus, Party Time, or Chill Evening!',
  },
  {
    id: 'autodj',
    title: 'Auto-DJ System',
    description: 'The AI analyzes your music and automatically suggests the perfect next track based on harmonic mixing, BPM matching, and energy flow.',
  },
  {
    id: 'queue',
    title: 'Play Queue',
    description: 'See upcoming tracks here. Auto-advance will automatically play the next track when the current one ends.',
  },
  {
    id: 'soundfx',
    title: 'DJ Sound Effects',
    description: 'Trigger DJ sound effects instantly with your keyboard (keys 1-8) or click the buttons!',
  },
  {
    id: 'complete',
    title: "You're All Set!",
    description: 'Start uploading music, choose a preset, and let the AI DJ take over. Enjoy!',
  },
];

const TOUR_STORAGE_KEY = 'music-jingles-tour-completed';

interface OnboardingTourProps {
  onComplete?: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if tour has been completed before
    const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!tourCompleted) {
      setIsActive(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setIsActive(false);
    if (onComplete) {
      onComplete();
    }
  };

  if (!isActive) return null;

  const step = TOUR_STEPS[currentStep];
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm" />

      {/* Tour Card */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
          {/* Progress Bar */}
          <div className="h-1 bg-gray-700">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-gray-400">
                Step {currentStep + 1} of {TOUR_STEPS.length}
              </span>
              <button
                onClick={handleSkip}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Skip Tour
              </button>
            </div>

            {/* Icon */}
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {currentStep === 0 && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                  {currentStep === TOUR_STEPS.length - 1 && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                  {currentStep > 0 && currentStep < TOUR_STEPS.length - 1 && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
              </div>
            </div>

            {/* Title & Description */}
            <h2 className="text-2xl font-bold text-white text-center mb-3">
              {step.title}
            </h2>
            <p className="text-gray-300 text-center mb-6 leading-relaxed">
              {step.description}
            </p>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-1"
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-all flex-1 font-medium"
              >
                {currentStep === TOUR_STEPS.length - 1 ? 'Get Started' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Function to reset tour (for testing or user preference)
export function resetOnboardingTour() {
  localStorage.removeItem(TOUR_STORAGE_KEY);
}
