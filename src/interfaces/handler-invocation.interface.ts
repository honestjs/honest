import type { Context } from 'hono'

/**
 * Input contract for invoking route handlers and mapping results to HTTP responses.
 */
export interface HandlerInvocationInput {
	handler: (...args: unknown[]) => Promise<unknown> | unknown
	args: unknown[]
	context: Context
	contextIndex?: number
}
