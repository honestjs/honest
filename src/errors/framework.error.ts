export interface FrameworkErrorOptions {
	status?: number
	code: string
	category: string
	remediation?: string
	details?: Record<string, unknown>
	cause?: unknown
}

/**
 * Structured framework-level error with machine-readable metadata.
 */
export class FrameworkError extends Error {
	readonly status?: number
	readonly code: string
	readonly category: string
	readonly remediation?: string
	readonly details?: Record<string, unknown>

	constructor(message: string, options: FrameworkErrorOptions) {
		super(message)
		this.name = 'FrameworkError'
		this.status = options.status
		this.code = options.code
		this.category = options.category
		this.remediation = options.remediation
		this.details = options.details

		if (options.cause !== undefined) {
			;(this as Error & { cause?: unknown }).cause = options.cause
		}
	}
}
