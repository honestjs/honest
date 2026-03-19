import type { HandlerInvocationInput } from '../interfaces'
import { isNil, isString } from '../utils'

/**
 * Invokes route handlers and maps non-Response results to Hono responses.
 */
export class HandlerInvoker {
	async invoke({ handler, args, context, contextIndex }: HandlerInvocationInput): Promise<unknown> {
		const result = await handler(...args)

		if (contextIndex !== undefined) {
			return result
		}

		if (result instanceof Response) {
			return result
		}

		if (isNil(result)) {
			return context.json(null)
		}

		if (isString(result)) {
			return context.text(result)
		}

		return context.json(result)
	}
}
