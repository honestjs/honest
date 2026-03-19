/**
 * Diagnostic log level.
 */
export type DiagnosticLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * Diagnostic category used to filter or route events.
 */
export type DiagnosticCategory = 'startup' | 'routes' | 'plugins' | 'deprecations' | 'pipeline' | 'di' | 'errors'

/**
 * Structured diagnostic event emitted by Honest runtime components.
 */
export interface DiagnosticEvent {
	level: DiagnosticLevel
	category: DiagnosticCategory
	message: string
	details?: Record<string, unknown>
}

/**
 * Diagnostics emitter contract.
 */
export interface IDiagnosticsEmitter {
	emit(event: DiagnosticEvent): void
}
