import type { Context, Next } from 'hono'
import type { Constructor } from '../types'

/**
 * Interface for HTTP middleware components
 * Middleware can process requests before they reach the route handler
 * and modify both the request and response
 */
export interface IMiddleware {
	/**
	 * Processes an HTTP request/response
	 * @param c - The Hono context containing request and response information
	 * @param next - Function to call the next middleware in the chain
	 * @returns A Promise that resolves to a Response or void
	 * @throws {Error} If middleware processing fails
	 */
	use(c: Context, next: Next): Promise<Response | void>
}

/**
 * Type for middleware implementations
 * Can be either a class implementing IMiddleware or an instance of IMiddleware
 */
export type MiddlewareType = Constructor<IMiddleware> | IMiddleware
