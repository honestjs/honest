import type { LogEvent, ILogger } from '../interfaces'

/**
 * Default logger that writes structured events to console.
 */
export class ConsoleLogger implements ILogger {
	emit(event: LogEvent): void {
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
