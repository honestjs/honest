import 'reflect-metadata'
import { afterEach, describe, expect, test } from 'bun:test'
import { Controller, Get, Service } from './decorators'
import { MetadataRegistry } from './registries'
import {
	createOnlyAController,
	createOnlyBController,
	createPayloadController,
	createRawResponseController,
	createTestController,
	createUnsafeParamController
} from './testing/fixtures/application-test-fixtures'
import { createControllerTestApplication } from './testing'

afterEach(() => {
	MetadataRegistry.clear()
})

describe('Application bootstrap', () => {
	test('create() registers module and getRoutes() returns expected route', async () => {
		const TestController = createTestController()
		const testApp = await createControllerTestApplication({
			controller: TestController
		})

		const routes = testApp.app.getRoutes()
		expect(routes.length).toBeGreaterThanOrEqual(1)
		const getRoute = routes.find((r) => r.method.toUpperCase() === 'GET' && r.fullPath.includes('health'))
		expect(getRoute).toBeDefined()
		expect(getRoute!.method.toUpperCase()).toBe('GET')

		const res = await testApp.request(getRoute!.fullPath)
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body).toEqual({ ok: true })
	})

	test('getContext() returns same instance and supports set/get', async () => {
		const testApp = await createControllerTestApplication({
			controller: createTestController()
		})
		const ctx = testApp.app.getContext()
		expect(ctx).toBe(testApp.app.getContext())

		ctx.set('test.key', { value: 123 })
		expect(ctx.get<{ value: number }>('test.key')).toEqual({ value: 123 })
		expect(ctx.has('test.key')).toBe(true)
	})

	test('getContainer() returns the DI container and can resolve services', async () => {
		@Service()
		class GreetService {
			greet(name: string) {
				return `Hello, ${name}`
			}
		}

		@Controller('/greet')
		class GreetController {
			constructor(private readonly svc: GreetService) {}
			@Get()
			index() {
				return { message: this.svc.greet('world') }
			}
		}

		const testApp = await createControllerTestApplication({
			controller: GreetController,
			services: [GreetService]
		})
		const container = testApp.app.getContainer()

		expect(container).toBeDefined()
		expect(container).toBe(testApp.app.getContainer())

		const svc = container.resolve(GreetService)
		expect(svc.greet('test')).toBe('Hello, test')
	})

	test('@Body() values are readable multiple times in one handler', async () => {
		const testApp = await createControllerTestApplication({
			controller: createPayloadController()
		})
		const res = await testApp.request(
			new Request('http://localhost/payload/echo', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ a: 'x', b: 'y' })
			})
		)

		expect(res.status).toBe(200)
		expect(await res.json()).toEqual({ a: 'x', b: 'y' })
	})

	test('handlers can return native Response without @Ctx()', async () => {
		const testApp = await createControllerTestApplication({
			controller: createRawResponseController()
		})
		const res = await testApp.request('/raw')

		expect(res.status).toBe(201)
		expect(res.headers.get('x-honest')).toBe('yes')
		expect(await res.text()).toBe('raw-ok')
	})

	test('each app has isolated routes (no leaking between apps)', async () => {
		const appA = await createControllerTestApplication({ controller: createOnlyAController() })
		expect(appA.app.getRoutes().some((route) => route.fullPath.includes('/only-a'))).toBe(true)

		const appB = await createControllerTestApplication({ controller: createOnlyBController() })
		expect(appB.app.getRoutes().some((route) => route.fullPath.includes('/only-b'))).toBe(true)
		expect(appB.app.getRoutes().some((route) => route.fullPath.includes('/only-a'))).toBe(false)
	})

	test('custom param decorator without factory uses safe fallback', async () => {
		const testApp = await createControllerTestApplication({
			controller: createUnsafeParamController()
		})
		const res = await testApp.request('/unsafe')

		expect(res.status).toBe(200)
		expect(await res.json()).toEqual({ hasValue: true })
	})
})
