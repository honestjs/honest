import { describe, expect, test } from 'bun:test'
import { Hono } from 'hono'
import { ErrorHandler } from './error.handler'
import { NotFoundHandler } from './not-found.handler'

describe('NotFoundHandler', () => {
	test('returns 404 with path in message', async () => {
		const app = new Hono()
		app.notFound(NotFoundHandler.handle())

		const res = await app.request(new Request('http://localhost/does-not-exist'))
		expect(res.status).toBe(404)
		const body = await res.json()
		expect(body.message).toContain('/does-not-exist')
		expect(body.message).toContain('Not Found')
	})
})

describe('ErrorHandler', () => {
	test('returns 500 JSON error response', async () => {
		const app = new Hono()
		app.get('/boom', () => {
			throw new Error('kaboom')
		})
		app.onError(ErrorHandler.handle())

		const res = await app.request(new Request('http://localhost/boom'))
		expect(res.status).toBe(500)
		const body = await res.json()
		expect(body.status).toBe(500)
		expect(body.path).toBe('/boom')
		expect(body.timestamp).toBeDefined()
	})
})
