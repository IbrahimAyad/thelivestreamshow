/**
 * Logger utility with verbosity levels to reduce console spam
 * Only shows important logs by default, with optional verbose mode
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose'

export interface LoggerConfig {
  level: LogLevel
  enabled: boolean
}

class Logger {
  private config: LoggerConfig = {
    level: 'info', // Only show info, warn, error by default
    enabled: true
  }

  private readonly levels: Record<LogLevel, number> = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    verbose: 4
  }

  /**
   * Set the logging configuration
   */
  setConfig(config: Partial<LoggerConfig>) {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current configuration
   */
  getConfig(): LoggerConfig {
    return { ...this.config }
  }

  /**
   * Enable or disable all logging
   */
  setEnabled(enabled: boolean) {
    this.config.enabled = enabled
  }

  /**
   * Set verbosity level
   */
  setLevel(level: LogLevel) {
    this.config.level = level
  }

  /**
   * Check if a log level should be shown
   */
  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false
    return this.levels[level] <= this.levels[this.config.level]
  }

  /**
   * Core logging method
   */
  private log(method: keyof Console, level: LogLevel, ...args: any[]) {
    if (!this.shouldLog(level)) return

    // Only show emojis for important events to reduce visual clutter
    const prefix = this.getLevelPrefix(level)
    
    console[method](prefix, ...args)
  }

  private getLevelPrefix(level: LogLevel): string {
    const prefixes: Record<LogLevel, string> = {
      error: '❌',
      warn: '⚠️',
      info: '',
      debug: '',
      verbose: ''
    }
    return prefixes[level]
  }

  /**
   * Public logging methods
   */
  error(...args: any[]) {
    this.log('error', 'error', ...args)
  }

  warn(...args: any[]) {
    this.log('warn', 'warn', ...args)
  }

  info(...args: any[]) {
    this.log('info', 'info', ...args)
  }

  debug(...args: any[]) {
    this.log('debug', 'debug', ...args)
  }

  verbose(...args: any[]) {
    this.log('log', 'verbose', ...args)
  }

  /**
   * Conditional logging - only logs if condition is met
   */
  infoIf(condition: boolean, ...args: any[]) {
    if (condition) this.info(...args)
  }

  debugIf(condition: boolean, ...args: any[]) {
    if (condition) this.debug(...args)
  }

  verboseIf(condition: boolean, ...args: any[]) {
    if (condition) this.verbose(...args)
  }

  /**
   * Mark critical conversation events that should always be logged
   */
  conversation(...args: any[]) {
    // Always log conversation-related events regardless of level
    console.log('💬', ...args)
  }

  /**
   * Mark critical system events
   */
  system(...args: any[]) {
    // Always log system events regardless of level
    console.log('🔧', ...args)
  }

  /**
   * Mark critical error events
   */
  critical(...args: any[]) {
    // Always log critical events
    console.error('🚨', ...args)
  }
}

// Create and export a singleton logger instance
export const logger = new Logger()

// Also export a function for convenient importing
export const createLogger = (name?: string) => {
  const prefixedLogger = {
    error: (...args: any[]) => logger.error(name ? `[${name}]` : '', ...args),
    warn: (...args: any[]) => logger.warn(name ? `[${name}]` : '', ...args),
    info: (...args: any[]) => logger.info(name ? `[${name}]` : '', ...args),
    debug: (...args: any[]) => logger.debug(name ? `[${name}]` : '', ...args),
    verbose: (...args: any[]) => logger.verbose(name ? `[${name}]` : '', ...args),
    infoIf: (condition: boolean, ...args: any[]) => logger.infoIf(condition, name ? `[${name}]` : '', ...args),
    debugIf: (condition: boolean, ...args: any[]) => logger.debugIf(condition, name ? `[${name}]` : '', ...args),
    verboseIf: (condition: boolean, ...args: any[]) => logger.verboseIf(condition, name ? `[${name}]` : '', ...args),
    conversation: (...args: any[]) => logger.conversation(name ? `[${name}]` : '', ...args),
    system: (...args: any[]) => logger.system(name ? `[${name}]` : '', ...args),
    critical: (...args: any[]) => logger.critical(name ? `[${name}]` : '', ...args),
    setConfig: (config: Partial<LoggerConfig>) => logger.setConfig(config),
    getConfig: () => logger.getConfig(),
    setEnabled: (enabled: boolean) => logger.setEnabled(enabled),
    setLevel: (level: LogLevel) => logger.setLevel(level),
  }
  return prefixedLogger
}

// Export default logger
export default logger
