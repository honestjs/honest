import type { HandlerInvocationInput } from '../interfaces'
import { FrameworkError } from '../errors'
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

		try {
			return context.json(result)
		} catch (error) {
			throw new FrameworkError('Handler return value could not be serialized as JSON.', {
				status: 500,
				code: 'RESPONSE_SERIALIZATION_FAILED',
				category: 'pipeline',
				remediation:
					'Return JSON-serializable values from handlers or map custom values in a filter before returning.',
				details: {
					handlerResultType: typeof result
				},
				cause: error
			})
		}
	}
}
