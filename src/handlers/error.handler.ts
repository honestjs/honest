import { createErrorResponse } from '../helpers'

import type { Context } from 'hono'

/**
 * Handler for managing application-wide error responses
 * Provides a consistent way to handle and format error responses across the application
 */
export class ErrorHandler {
	/**
	 * Creates a middleware function that handles error responses
	 * @returns A middleware function that formats and returns error responses using createErrorResponse
	 */
	static handle() {
		return async (err: Error, c: Context) => {
			return c.json(createErrorResponse(err, c))
		}
	}
}
