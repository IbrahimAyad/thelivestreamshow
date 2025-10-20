/**
 * Production-Ready Logger
 *
 * Uses pino for structured logging with:
 * - Pretty formatting in development
 * - JSON output in production
 * - Automatic log level filtering
 * - Performance optimized
 */

import pino from 'pino';

/**
 * Configure logger based on environment
 */
export const logger = pino({
  level: import.meta.env.PROD ? 'info' : 'debug',

  // Pretty printing in development only
  transport: !import.meta.env.PROD
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      }
    : undefined,

  // Base configuration
  base: {
    env: import.meta.env.MODE,
  },

  // Custom formatters
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },

  // Browser-specific configuration
  browser: {
    asObject: true,
    serialize: true,
  },
});

/**
 * Create a child logger with context
 */
export function createLogger(context: string) {
  return logger.child({ context });
}

/**
 * Log levels:
 * - debug: Verbose AI decisions, internal state
 * - info: State changes, operations
 * - warn: Blocked actions, recoverable issues
 * - error: Failures, exceptions
 */

// Module-specific loggers
export const aiLogger = createLogger('AI');
export const coordinatorLogger = createLogger('Coordinator');
export const moodLogger = createLogger('BetaBot');
export const predictiveLogger = createLogger('Predictive');
export const contextLogger = createLogger('Context');
export const hostLogger = createLogger('Host');

/**
 * Helper function for error logging with stack traces
 */
export function logError(logger: pino.Logger, error: Error | unknown, message?: string) {
  if (error instanceof Error) {
    logger.error(
      {
        err: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
      },
      message || error.message
    );
  } else {
    logger.error({ err: error }, message || 'Unknown error');
  }
}

/**
 * Helper for performance timing
 */
export function createTimer(logger: pino.Logger, operation: string) {
  const start = Date.now();
  return {
    end: () => {
      const duration = Date.now() - start;
      logger.debug({ operation, duration }, `${operation} completed in ${duration}ms`);
    },
  };
}

/**
 * Log levels guide:
 *
 * DEBUG: Detailed information for diagnosing problems
 * - AI decision reasoning
 * - Internal state changes
 * - Function entry/exit
 *
 * INFO: Confirmation that things are working as expected
 * - Mood changes applied
 * - Questions approved
 * - Initialization complete
 *
 * WARN: Something unexpected happened, but we can continue
 * - Context suggestions blocked
 * - Manual override active
 * - Duplicate detected
 *
 * ERROR: A serious problem occurred
 * - Database failures
 * - API errors
 * - Initialization failures
 */
