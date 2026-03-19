import type { DiagnosticEvent, IDiagnosticsEmitter } from '../interfaces'

/**
 * Diagnostics emitter implementation that intentionally does nothing.
 */
export class NoopDiagnosticsEmitter implements IDiagnosticsEmitter {
	emit(_event: DiagnosticEvent): void {
		// no-op
	}
}
