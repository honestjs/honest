/**
 * Log level.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * Log category used to filter or route events.
 */
export type LogCategory = 'startup' | 'routes' | 'plugins' | 'deprecations' | 'pipeline' | 'di' | 'errors'

/**
 * Structured log event emitted by Honest runtime components.
 */
export interface LogEvent {
	level: LogLevel
	category: LogCategory
	message: string
	details?: Record<string, unknown>
}

/**
 * Logger contract.
 */
export interface ILogger {
	emit(event: LogEvent): void
}
