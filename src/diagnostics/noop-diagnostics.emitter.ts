import type { LogEvent, ILogger } from '../interfaces'

/**
 * Logger implementation that intentionally does nothing.
 */
export class NoopLogger implements ILogger {
	emit(_event: LogEvent): void {
		// no-op
	}
}
