import { describe, expect, test } from 'bun:test'
import type { Context } from 'hono'
import { FrameworkError } from '../errors'
import { HandlerInvoker } from './handler.invoker'

function createContextStub() {
	return {
		json(value: unknown) {
			return new Response(JSON.stringify(value), {
				headers: { 'content-type': 'application/json' }
			})
		},
		text(value: string) {
			return new Response(value, {
				headers: { 'content-type': 'text/plain;charset=UTF-8' }
			})
		}
	} as unknown as Context
}

describe('HandlerInvoker', () => {
	test('passes through native Response', async () => {
		const invoker = new HandlerInvoker()
		const response = new Response('ok')

		const result = await invoker.invoke({
			handler: () => response,
			args: [],
			context: createContextStub()
		})

		expect(result).toBe(response)
	})

	test('maps string result to text response', async () => {
		const invoker = new HandlerInvoker()

		const result = await invoker.invoke({
			handler: () => 'hello',
			args: [],
			context: createContextStub()
		})

		expect(result).toBeInstanceOf(Response)
		expect(await (result as Response).text()).toBe('hello')
	})

	test('maps nil result to json null response', async () => {
		const invoker = new HandlerInvoker()

		const result = await invoker.invoke({
			handler: () => undefined,
			args: [],
			context: createContextStub()
		})

		expect(result).toBeInstanceOf(Response)
		expect(await (result as Response).text()).toBe('null')
	})

	test('returns raw result when context parameter exists', async () => {
		const invoker = new HandlerInvoker()

		const result = await invoker.invoke({
			handler: () => ({ ok: true }),
			args: [],
			context: createContextStub(),
			contextIndex: 0
		})

		expect(result).toEqual({ ok: true })
	})

	test('throws FrameworkError for BigInt response payload', async () => {
		const invoker = new HandlerInvoker()

		await expect(
			invoker.invoke({
				handler: () => ({ id: 1n }),
				args: [],
				context: createContextStub()
			})
		).rejects.toMatchObject<Partial<FrameworkError>>({
			name: 'FrameworkError',
			code: 'RESPONSE_SERIALIZATION_FAILED',
			status: 500
		})
	})

	test('throws FrameworkError for circular response payload', async () => {
		const invoker = new HandlerInvoker()
		const circular: { self?: unknown } = {}
		circular.self = circular

		await expect(
			invoker.invoke({
				handler: () => circular,
				args: [],
				context: createContextStub()
			})
		).rejects.toMatchObject<Partial<FrameworkError>>({
			name: 'FrameworkError',
			code: 'RESPONSE_SERIALIZATION_FAILED',
			status: 500
		})
	})
})
