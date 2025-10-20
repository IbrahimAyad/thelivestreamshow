/**
 * Sentry Error Monitoring
 *
 * Centralized error tracking for the livestream AI coordinator.
 * Captures errors, performance metrics, and custom context.
 */

import * as Sentry from '@sentry/react';

export interface MonitoringContext {
  showSegment?: string;
  coordinatorConfig?: {
    enablePredictions?: boolean;
    enableHostProfile?: boolean;
    enableContextMemory?: boolean;
  };
  moodOverride?: {
    active: boolean;
    mood?: string;
    expiresAt?: string;
  };
}

/**
 * Initialize Sentry monitoring
 */
export function initMonitoring() {
  // Only initialize if DSN is provided
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.warn('⚠️ Sentry DSN not configured - error monitoring disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,

    // Performance monitoring - 10% sample rate
    tracesSampleRate: 0.1,

    // Only send errors in production
    enabled: import.meta.env.PROD,

    // Integrations
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],

    // Session replay - 10% of sessions
    replaysSessionSampleRate: 0.1,
    // Replay on error - 100% of errors
    replaysOnErrorSampleRate: 1.0,

    // Before sending events
    beforeSend(event, hint) {
      // Don't send events in development
      if (import.meta.env.DEV) {
        console.error('Sentry event (not sent in dev):', event);
        return null;
      }

      // Filter out known non-critical errors
      const error = hint.originalException as Error;
      if (error?.message?.includes('Network request failed')) {
        // Network errors are expected occasionally
        return null;
      }

      return event;
    },
  });

  console.log('✅ Sentry monitoring initialized');
}

/**
 * Set user context for error tracking
 */
export function setUserContext(user: { id: string; email?: string; role?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Add custom context to error reports
 */
export function setMonitoringContext(context: MonitoringContext) {
  Sentry.setContext('coordinator', {
    showSegment: context.showSegment,
    config: context.coordinatorConfig,
    moodOverride: context.moodOverride,
  });
}

/**
 * Track a custom event (non-error)
 */
export function trackEvent(
  eventName: string,
  data?: Record<string, any>
) {
  Sentry.captureMessage(eventName, {
    level: 'info',
    extra: data,
  });
}

/**
 * Capture an error with additional context
 */
export function captureError(
  error: Error,
  context?: {
    module?: string;
    operation?: string;
    data?: Record<string, any>;
  }
) {
  Sentry.captureException(error, {
    tags: {
      module: context?.module,
      operation: context?.operation,
    },
    extra: context?.data,
  });
}

/**
 * Start a performance transaction
 */
export function startTransaction(
  name: string,
  operation: string
): Sentry.Span | undefined {
  return Sentry.startSpan({
    name,
    op: operation,
  }, (span) => span);
}

/**
 * Wrapper for async functions with error tracking
 */
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  module: string,
  operation: string
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await Sentry.startSpan(
        {
          name: `${module}.${operation}`,
          op: operation,
        },
        async () => {
          return await fn(...args);
        }
      );
    } catch (error) {
      captureError(error as Error, {
        module,
        operation,
        data: {
          args: args.map((arg) => {
            // Serialize arguments safely
            try {
              return JSON.stringify(arg);
            } catch {
              return '[Circular]';
            }
          }),
        },
      });
      throw error;
    }
  }) as T;
}

/**
 * React Error Boundary component
 */
export const ErrorBoundary = Sentry.ErrorBoundary;

/**
 * Profile a function for performance monitoring
 */
export function profileFunction<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    return Sentry.startSpan(
      {
        name,
        op: 'function',
      },
      () => fn(...args)
    );
  }) as T;
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
  });
}

/**
 * Critical error - always sent, triggers alert
 */
export function reportCriticalError(
  error: Error,
  context?: {
    module: string;
    operation: string;
    impact: 'low' | 'medium' | 'high';
    data?: Record<string, any>;
  }
) {
  Sentry.captureException(error, {
    level: 'error',
    tags: {
      module: context?.module,
      operation: context?.operation,
      impact: context?.impact || 'medium',
      critical: 'true',
    },
    extra: context?.data,
  });
}
