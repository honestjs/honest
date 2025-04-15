import type { Context } from 'hono'

/**
 * Handler for managing 404 Not Found responses
 * Provides a consistent way to handle requests to non-existent routes
 */
export class NotFoundHandler {
	/**
	 * Creates a middleware function that handles 404 Not Found responses
	 * @returns A middleware function that returns a JSON response with a 404 status
	 */
	static handle() {
		return async (c: Context) => {
			return c.json(
				{
					message: `Not Found - ${c.req.path}`
				},
				404
			)
		}
	}
}
