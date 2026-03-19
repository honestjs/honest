import { describe, expect, test } from 'bun:test'
import { Hono } from 'hono'
import { FrameworkError } from '../errors'
import { HTTPException } from 'hono/http-exception'
import { createErrorResponse } from './create-error-response.helper'

function makeContext(path = '/test', vars: Record<string, unknown> = {}) {
	return {
		async run(exception: Error, options?: Parameters<typeof createErrorResponse>[2]) {
			let result!: ReturnType<typeof createErrorResponse>
			const app = new Hono()
			app.get(path, (c) => {
				for (const [k, v] of Object.entries(vars)) {
					c.set(k as never, v as never)
				}
				result = createErrorResponse(exception, c, options)
				return c.text('ok')
			})
			await app.request(new Request(`http://localhost${path}`))
			return result
		}
	}
}

describe('createErrorResponse', () => {
	test('HTTPException → correct status and message', async () => {
		const helper = makeContext()
		const { response, status } = await helper.run(new HTTPException(403, { message: 'Forbidden' }))
		expect(status).toBe(403)
		expect(response.status).toBe(403)
		expect(response.message).toBe('Forbidden')
		expect(response.path).toBe('/test')
		expect(response.timestamp).toBeDefined()
	})

	test('Error with statusCode property', async () => {
		const helper = makeContext()
		const err = Object.assign(new Error('Bad Request'), { statusCode: 400 })
		const { response, status } = await helper.run(err)
		expect(status).toBe(400)
		expect(response.message).toBe('Bad Request')
	})

	test('Error with status property', async () => {
		const helper = makeContext()
		const err = Object.assign(new Error('Not Found'), { status: 404 })
		const { response, status } = await helper.run(err)
		expect(status).toBe(404)
		expect(response.message).toBe('Not Found')
	})

	test('generic Error → 500', async () => {
		const helper = makeContext()
		const { response, status } = await helper.run(new Error('something broke'))
		expect(status).toBe(500)
		expect(response.status).toBe(500)
	})

	test('options override status and title', async () => {
		const helper = makeContext()
		const { response, status } = await helper.run(new HTTPException(400), {
			status: 422,
			title: 'Custom Title'
		})
		expect(status).toBe(422)
		expect(response.message).toBe('Custom Title')
	})

	test('options.detail is included when provided', async () => {
		const helper = makeContext()
		const { response } = await helper.run(new HTTPException(400), { detail: 'extra info' })
		expect((response as any).detail).toBe('extra info')
	})

	test('options.code and additionalDetails are included', async () => {
		const helper = makeContext()
		const { response } = await helper.run(new HTTPException(400), {
			code: 'VALIDATION_ERROR',
			additionalDetails: { field: 'email' }
		})
		expect(response.code).toBe('VALIDATION_ERROR')
		expect(response.details).toEqual({ field: 'email' })
	})

	test('requestId is included when set in context', async () => {
		const helper = makeContext('/test', { requestId: 'req-123' })
		const { response } = await helper.run(new Error('fail'))
		expect(response.requestId).toBe('req-123')
	})

	test('path from context.req.path', async () => {
		const helper = makeContext('/api/users')
		const { response } = await helper.run(new Error('fail'))
		expect(response.path).toBe('/api/users')
	})

	test('FrameworkError includes code/category/remediation details', async () => {
		const helper = makeContext('/framework-error')
		const { response, status } = await helper.run(
			new FrameworkError('Container bootstrap failed', {
				status: 503,
				code: 'DI_BOOTSTRAP_FAILED',
				category: 'di',
				remediation: 'Ensure all services are decorated with @Service()'
			})
		)

		expect(status).toBe(503)
		expect(response.code).toBe('DI_BOOTSTRAP_FAILED')
		expect((response.details as Record<string, unknown>)?.category).toBe('di')
		expect((response.details as Record<string, unknown>)?.remediation).toBe(
			'Ensure all services are decorated with @Service()'
		)
	})
})
