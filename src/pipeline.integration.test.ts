import 'reflect-metadata'
import { describe, expect, test } from 'bun:test'
import { Controller, Get, UseFilters, UseGuards, UseMiddleware, UsePipes } from './decorators'
import { createParamDecorator } from './helpers'
import type { DiagnosticEvent, IDiagnosticsEmitter, IFilter, IGuard, IMiddleware, IPipe } from './interfaces'
import { createTestApplication } from './testing'
import type { Context, Next } from 'hono'

const order: string[] = []

function resetOrder() {
	order.length = 0
}

const TrackingMiddleware: IMiddleware = {
	async use(_c: Context, next: Next) {
		order.push('middleware')
		await next()
	}
}

const TrackingGuard: IGuard = {
	canActivate() {
		order.push('guard')
		return true
	}
}

const RejectingGuard: IGuard = {
	canActivate() {
		order.push('guard-reject')
		return false
	}
}

const TrackingPipe: IPipe = {
	transform(value: unknown) {
		order.push('pipe')
		return `piped:${value}`
	}
}

const DoublingPipe: IPipe = {
	transform(value: unknown) {
		order.push('pipe2')
		return `${value}+${value}`
	}
}

const TrackingFilter: IFilter = {
	catch(exception: any, context: Context): Response {
		order.push('filter')
		return context.json({ filtered: true, message: exception.message }, 500)
	}
}

const CustomParam = createParamDecorator('custom', (_data, c) => c.req.query('val') || 'default')
const AsyncCustomParam = createParamDecorator('custom', async (_data, c) => {
	await Promise.resolve()
	return c.req.query('val') || 'default'
})

describe('Pipeline integration', () => {
	test('execution order: middleware → guard → pipe → handler', async () => {
		resetOrder()

		@Controller('/order')
		@UseMiddleware(TrackingMiddleware)
		@UseGuards(TrackingGuard)
		@UsePipes(TrackingPipe)
		class OrderController {
			@Get()
			index(@CustomParam() val: string) {
				order.push('handler')
				return { val }
			}
		}

		const testApp = await createTestApplication({ controllers: [OrderController] })
		const res = await testApp.request('/order?val=hello')

		expect(res.status).toBe(200)
		expect(order).toEqual(['middleware', 'guard', 'pipe', 'handler'])
	})

	test('guard rejection short-circuits (no pipe/handler run)', async () => {
		resetOrder()

		@Controller('/rejected')
		@UseGuards(RejectingGuard)
		@UsePipes(TrackingPipe)
		class RejectedController {
			@Get()
			index(@CustomParam() _val: string) {
				order.push('handler')
				return { ok: true }
			}
		}

		const testApp = await createTestApplication({ controllers: [RejectedController] })
		const res = await testApp.request('/rejected')

		expect(res.status).toBe(403)
		expect(order).toEqual(['guard-reject'])
		expect(order).not.toContain('pipe')
		expect(order).not.toContain('handler')
	})

	test('pipe transforms value before handler receives it', async () => {
		resetOrder()

		@Controller('/piped')
		@UsePipes(TrackingPipe)
		class PipedController {
			@Get()
			index(@CustomParam() val: string) {
				return { val }
			}
		}

		const testApp = await createTestApplication({ controllers: [PipedController] })
		const res = await testApp.request('/piped?val=raw')
		const body = await res.json()
		expect(body.val).toBe('piped:raw')
	})

	test('async parameter factory resolves before pipes execute', async () => {
		resetOrder()

		@Controller('/async-param')
		@UsePipes(TrackingPipe)
		class AsyncParamController {
			@Get()
			index(@AsyncCustomParam() val: string) {
				return { val }
			}
		}

		const testApp = await createTestApplication({ controllers: [AsyncParamController] })
		const res = await testApp.request('/async-param?val=raw')
		const body = await res.json()
		expect(body.val).toBe('piped:raw')
		expect(order).toEqual(['pipe'])
	})

	test('multiple pipes chain correctly', async () => {
		resetOrder()

		@Controller('/chain')
		class ChainController {
			@Get()
			@UsePipes(TrackingPipe, DoublingPipe)
			index(@CustomParam() val: string) {
				return { val }
			}
		}

		const testApp = await createTestApplication({ controllers: [ChainController] })
		const res = await testApp.request('/chain?val=x')
		const body = await res.json()
		expect(body.val).toBe('piped:x+piped:x')
		expect(order).toEqual(['pipe', 'pipe2'])
	})

	test('filter catches exception and returns custom response', async () => {
		resetOrder()

		@Controller('/filtered')
		@UseFilters(TrackingFilter)
		class FilteredController {
			@Get()
			index() {
				throw new Error('test error')
			}
		}

		const testApp = await createTestApplication({ controllers: [FilteredController] })
		const res = await testApp.request('/filtered')
		const body = await res.json()

		expect(res.status).toBe(500)
		expect(body.filtered).toBe(true)
		expect(body.message).toBe('test error')
		expect(order).toContain('filter')
	})

	test('global + controller + handler ordering for guards', async () => {
		const levels: string[] = []

		const GlobalGuard: IGuard = {
			canActivate() {
				levels.push('global')
				return true
			}
		}
		const ControllerGuard: IGuard = {
			canActivate() {
				levels.push('controller')
				return true
			}
		}
		const HandlerGuard: IGuard = {
			canActivate() {
				levels.push('handler')
				return true
			}
		}

		@Controller('/levels')
		@UseGuards(ControllerGuard)
		class LevelsController {
			@Get()
			@UseGuards(HandlerGuard)
			index() {
				return { ok: true }
			}
		}

		const testApp = await createTestApplication({
			controllers: [LevelsController],
			appOptions: { components: { guards: [GlobalGuard] } }
		})

		await testApp.request('/levels')
		expect(levels).toEqual(['global', 'controller', 'handler'])
	})

	test('pipeline diagnostics emits event when guard rejects in debug mode', async () => {
		const events: DiagnosticEvent[] = []
		const diagnostics: IDiagnosticsEmitter = {
			emit(event) {
				events.push(event)
			}
		}

		@Controller('/diag-reject')
		@UseGuards(RejectingGuard)
		class DiagnosticsRejectController {
			@Get()
			index() {
				return { ok: true }
			}
		}

		const testApp = await createTestApplication({
			controllers: [DiagnosticsRejectController],
			appOptions: {
				debug: { pipeline: true },
				diagnostics
			}
		})

		const res = await testApp.request('/diag-reject')
		expect(res.status).toBe(403)
		expect(
			events.some(
				(event) =>
					event.category === 'pipeline' &&
					event.level === 'warn' &&
					event.message.includes('Guard rejected request')
			)
		).toBe(true)
	})
})
