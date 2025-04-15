import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { ErrorResponse } from '../interfaces'

/**
 * Creates a standardized error response object
 * @param exception - The error or exception object to process
 * @param context - The Hono context object containing request information
 * @param options - Optional configuration for the error response
 * @param options.status - HTTP status code to override the default
 * @param options.title - Custom error message to override the default
 * @param options.detail - Additional error details
 * @param options.code - Custom error code
 * @param options.additionalDetails - Extra information to include in the response
 * @returns Object containing the formatted error response and HTTP status code
 */
export function createErrorResponse(
	exception: Error,
	context: Context,
	options?: {
		status?: number
		title?: string
		detail?: string
		code?: string
		additionalDetails?: Record<string, any>
	}
): { response: ErrorResponse; status: ContentfulStatusCode } {
	const timestamp = new Date().toISOString()
	const requestId = context.get('requestId')
	const path = context.req.path

	// Handle HTTPException (Hono's built-in exception)
	if (exception instanceof HTTPException) {
		const response: ErrorResponse = {
			status: options?.status || exception.status,
			message: options?.title || exception.message,
			timestamp,
			path,
			requestId,
			code: options?.code,
			details: options?.additionalDetails,
			...(options?.detail && { detail: options.detail })
		}

		return { response, status: (options?.status || exception.status) as ContentfulStatusCode }
	}

	// Combined status handling
	if ((exception as any).statusCode || (exception as any).status) {
		const defaultStatus = (exception as any).statusCode || (exception as any).status
		const status = options?.status || defaultStatus
		const response: ErrorResponse = {
			status,
			message: options?.title || exception.message,
			timestamp,
			path,
			requestId,
			code: options?.code || exception.name,
			details: options?.additionalDetails,
			...(options?.detail && { detail: options.detail })
		}

		return {
			response,
			status: status as ContentfulStatusCode
		}
	}

	// Handle unexpected errors
	const status = (options?.status || 500) as ContentfulStatusCode
	const response: ErrorResponse = {
		status,
		message:
			options?.title || (process.env.NODE_ENV === 'production' ? 'Internal Server Error' : exception.message),
		timestamp,
		path,
		requestId,
		code: options?.code || exception.name,
		details:
			options?.additionalDetails ||
			(process.env.NODE_ENV === 'development' ? { stack: exception.stack } : undefined),
		...(options?.detail && { detail: options.detail })
	}

	return { response, status }
}
