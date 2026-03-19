import type { DiagnosticEvent, IDiagnosticsEmitter } from '../interfaces'

/**
 * Default diagnostics emitter that writes structured events to console.
 */
export class ConsoleDiagnosticsEmitter implements IDiagnosticsEmitter {
	emit(event: DiagnosticEvent): void {
		const prefix = `[HonestJS:${event.category}]`
		const payload = event.details ? [prefix, event.message, event.details] : [prefix, event.message]

		switch (event.level) {
			case 'debug':
			case 'info':
				console.info(...payload)
				break
			case 'warn':
				console.warn(...payload)
				break
			case 'error':
				console.error(...payload)
				break
		}
	}
}
