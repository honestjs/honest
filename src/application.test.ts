import 'reflect-metadata'
import { describe, expect, test } from 'bun:test'
import { Application } from './application'
import { Body, Controller, Get, Module, Post, Service, UseFilters } from './decorators'
import { createParamDecorator } from './helpers'
import type { DiagnosticEvent, IDiagnosticsEmitter, IFilter, IGuard } from './interfaces'
import { MetadataRegistry } from './registries'
import { createControllerTestApplication, createServiceTestContainer, createTestApplication } from './testing'

@Controller('/health')
class TestController {
	@Get()
	index() {
		return { ok: true }
	}
}

@Controller('/payload')
class PayloadController {
	@Post('echo')
	async echo(@Body('a') a: string, @Body('b') b: string) {
		return { a, b }
	}
}

@Controller('/raw')
class RawResponseController {
	@Get()
	raw() {
		return new Response('raw-ok', {
			status: 201,
			headers: { 'x-honest': 'yes' }
		})
	}
}

@Controller('/only-a')
class OnlyAController {
	@Get()
	index() {
		return { app: 'a' }
	}
}

@Controller('/only-b')
class OnlyBController {
	@Get()
	index() {
		return { app: 'b' }
	}
}

class UndecoratedController {
	hello() {
		return 'hello'
	}
}

@Module({ controllers: [UndecoratedController] })
class BrokenControllerModule {}

@Module()
class EmptyModule {}

@Controller('/dup')
class DuplicateAController {
	@Get()
	index() {
		return { ok: 'a' }
	}
}

@Controller('/dup')
class DuplicateBController {
	@Get()
	index() {
		return { ok: 'b' }
	}
}

const UnsafeParam = createParamDecorator('unsafe')

@Controller('/unsafe')
class UnsafeParamController {
	@Get()
	check(@UnsafeParam() value: unknown) {
		return { hasValue: value !== undefined }
	}
}

@Controller('/diag-a')
class DiagnosticsAController {
	@Get()
	index() {
		return { controller: 'a' }
	}
}

@Controller('/diag-b')
class DiagnosticsBController {
	@Get()
	index() {
		return { controller: 'b' }
	}
}

@Controller('/runtime-metadata')
class RuntimeMetadataController {
	@Get()
	index() {
		throw new Error('runtime metadata baseline error')
	}
}

describe('Application', () => {
	test('create() registers module and getRoutes() returns expected route', async () => {
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
			controller: TestController
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

	test('plain plugin without processors still works', async () => {
		const order: string[] = []
		const TestPlugin = {
			beforeModulesRegistered: async () => {
				order.push('before')
			},
			afterModulesRegistered: async () => {
				order.push('after')
			}
		}
		await createControllerTestApplication({
			controller: TestController,
			appOptions: { plugins: [TestPlugin] }
		})
		expect(order).toEqual(['before', 'after'])
	})

	test('plugin with preProcessors and postProcessors runs in correct order', async () => {
		const order: string[] = []
		const TestPlugin = {
			beforeModulesRegistered: async () => {
				order.push('before')
			},
			afterModulesRegistered: async () => {
				order.push('after')
			}
		}
		const pre1 = async (_app: unknown, _hono: unknown, ctx: { set: (k: string, v: string) => void }) => {
			order.push('pre1')
			ctx.set('plugin.order', 'pre1')
		}
		const pre2 = async () => {
			order.push('pre2')
		}
		const post1 = async (_app: unknown, _hono: unknown, ctx: { get: (k: string) => unknown }) => {
			order.push('post1')
			expect(ctx.get('plugin.order')).toBe('pre1')
		}
		await createControllerTestApplication({
			controller: TestController,
			appOptions: {
				plugins: [
					{
						plugin: TestPlugin,
						preProcessors: [pre1, pre2],
						postProcessors: [post1]
					}
				]
			}
		})
		expect(order).toEqual(['pre1', 'pre2', 'before', 'after', 'post1'])
	})

	test('plugin before/after constraints are respected deterministically', async () => {
		const order: string[] = []

		const ConfigPlugin = {
			beforeModulesRegistered: async () => {
				order.push('config:before')
			},
			afterModulesRegistered: async () => {
				order.push('config:after')
			}
		}

		const MetricsPlugin = {
			beforeModulesRegistered: async () => {
				order.push('metrics:before')
			},
			afterModulesRegistered: async () => {
				order.push('metrics:after')
			}
		}

		await createTestApplication({
			module: EmptyModule,
			appOptions: {
				plugins: [
					{ plugin: MetricsPlugin, name: 'metrics', after: ['config'] },
					{ plugin: ConfigPlugin, name: 'config' }
				]
			}
		})

		expect(order).toEqual(['config:before', 'metrics:before', 'config:after', 'metrics:after'])
	})

	test('plugin ordering fails fast when constraints reference unknown plugin', async () => {
		await expect(
			createTestApplication({
				module: EmptyModule,
				appOptions: {
					plugins: [{ plugin: {}, name: 'metrics', after: ['config'] }]
				}
			})
		).rejects.toThrow("declares after 'config'")
	})

	test('plugin capability contracts succeed when requirements are provided earlier', async () => {
		const docsPlugin = {
			meta: {
				name: 'docs',
				requires: ['artifact:routes'],
				provides: ['http:openapi']
			}
		}

		const artifactPlugin = {
			meta: {
				name: 'artifact',
				provides: ['artifact:routes']
			}
		}

		await expect(
			createTestApplication({
				module: EmptyModule,
				appOptions: {
					plugins: [
						{ plugin: docsPlugin, name: 'docs', after: ['artifact'] },
						{ plugin: artifactPlugin, name: 'artifact' }
					]
				}
			})
		).resolves.toBeDefined()
	})

	test('plugin capability contracts fail when required capability is missing', async () => {
		const docsPlugin = {
			meta: {
				name: 'docs',
				requires: ['artifact:routes']
			}
		}

		await expect(
			createTestApplication({
				module: EmptyModule,
				appOptions: {
					plugins: [{ plugin: docsPlugin, name: 'docs' }]
				}
			})
		).rejects.toThrow("requires 'artifact:routes'")
	})

	test('@Body() values are readable multiple times in one handler', async () => {
		const testApp = await createControllerTestApplication({
			controller: PayloadController
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
			controller: RawResponseController
		})
		const res = await testApp.request('/raw')

		expect(res.status).toBe(201)
		expect(res.headers.get('x-honest')).toBe('yes')
		expect(await res.text()).toBe('raw-ok')
	})

	test('each app has isolated routes (no leaking between apps)', async () => {
		const appA = await createControllerTestApplication({ controller: OnlyAController })
		expect(appA.app.getRoutes().some((route) => route.fullPath.includes('/only-a'))).toBe(true)

		const appB = await createControllerTestApplication({ controller: OnlyBController })
		expect(appB.app.getRoutes().some((route) => route.fullPath.includes('/only-b'))).toBe(true)
		expect(appB.app.getRoutes().some((route) => route.fullPath.includes('/only-a'))).toBe(false)
	})

	test('custom param decorator without factory uses safe fallback', async () => {
		const testApp = await createControllerTestApplication({
			controller: UnsafeParamController
		})
		const res = await testApp.request('/unsafe')

		expect(res.status).toBe(200)
		expect(await res.json()).toEqual({ hasValue: true })
	})

	test('fails with clear message for controllers missing @Controller()', async () => {
		await expect(createTestApplication({ controllers: [UndecoratedController] })).rejects.toThrow(
			'is not decorated with @Controller()'
		)
	})

	test('strict.requireRoutes fails startup when no routes are registered', async () => {
		await expect(Application.create(EmptyModule, { strict: { requireRoutes: true } })).rejects.toThrow(
			'Strict mode: no routes were registered'
		)
	})

	test('startup diagnostics includes route count in debug mode', async () => {
		const events: DiagnosticEvent[] = []
		const diagnostics: IDiagnosticsEmitter = {
			emit(event) {
				events.push(event)
			}
		}

		await createControllerTestApplication({
			controller: TestController,
			appOptions: {
				debug: true,
				diagnostics
			}
		})

		expect(
			events.some(
				(event) =>
					event.category === 'startup' &&
					event.level === 'info' &&
					event.message.includes('Application registered') &&
					Number((event.details as Record<string, unknown>)?.routeCount) >= 1
			)
		).toBe(true)
	})

	test('strict.requireRoutes emits startup diagnostic error before throwing', async () => {
		const events: DiagnosticEvent[] = []
		const diagnostics: IDiagnosticsEmitter = {
			emit(event) {
				events.push(event)
			}
		}

		await expect(
			Application.create(EmptyModule, {
				strict: { requireRoutes: true },
				diagnostics
			})
		).rejects.toThrow('Strict mode: no routes were registered')

		expect(
			events.some(
				(event) =>
					event.category === 'startup' &&
					event.level === 'error' &&
					event.message.includes('Strict mode failed')
			)
		).toBe(true)
	})

	test('startup diagnostics includes completion event with timing details', async () => {
		const events: DiagnosticEvent[] = []
		const diagnostics: IDiagnosticsEmitter = {
			emit(event) {
				events.push(event)
			}
		}

		await createControllerTestApplication({
			controller: TestController,
			appOptions: {
				debug: true,
				diagnostics
			}
		})

		const startupCompleted = events.find(
			(event) =>
				event.category === 'startup' &&
				event.level === 'info' &&
				event.message === 'Application startup completed'
		)

		expect(startupCompleted).toBeDefined()
		expect(
			Number((startupCompleted?.details as Record<string, unknown>)?.startupDurationMs)
		).toBeGreaterThanOrEqual(0)
		expect(Number((startupCompleted?.details as Record<string, unknown>)?.routeCount)).toBeGreaterThanOrEqual(1)
	})

	test('debug.startup enables startup diagnostics independently from debug.routes', async () => {
		const events: DiagnosticEvent[] = []
		const diagnostics: IDiagnosticsEmitter = {
			emit(event) {
				events.push(event)
			}
		}

		await createControllerTestApplication({
			controller: TestController,
			appOptions: {
				debug: { startup: true, routes: false },
				diagnostics
			}
		})

		expect(events.some((event) => event.category === 'startup')).toBe(true)
		expect(events.some((event) => event.category === 'routes')).toBe(false)
	})

	test('startup diagnostics emits generic startup failure event in debug mode', async () => {
		const events: DiagnosticEvent[] = []
		const diagnostics: IDiagnosticsEmitter = {
			emit(event) {
				events.push(event)
			}
		}

		await expect(Application.create(BrokenControllerModule, { debug: true, diagnostics })).rejects.toThrow(
			'is not decorated with @Controller()'
		)

		expect(
			events.some(
				(event) =>
					event.category === 'startup' &&
					event.level === 'error' &&
					event.message === 'Application startup failed' &&
					String((event.details as Record<string, unknown>)?.errorMessage || '').includes(
						'is not decorated with @Controller()'
					)
			)
		).toBe(true)
	})

	test('startupGuide emits actionable hints for strict no-routes startup failure', async () => {
		const events: DiagnosticEvent[] = []
		const diagnostics: IDiagnosticsEmitter = {
			emit(event) {
				events.push(event)
			}
		}

		await expect(
			Application.create(EmptyModule, {
				strict: { requireRoutes: true },
				startupGuide: true,
				diagnostics
			})
		).rejects.toThrow('Strict mode: no routes were registered')

		const guideEvent = events.find((event) => event.category === 'startup' && event.message === 'Startup guide')
		expect(guideEvent).toBeDefined()
		expect(Array.isArray((guideEvent?.details as Record<string, unknown>)?.hints)).toBe(true)
		expect(
			((guideEvent?.details as Record<string, unknown>)?.hints as string[]).some((hint) =>
				hint.includes('strict.requireRoutes')
			)
		).toBe(true)
	})

	test('startupGuide emits actionable hints for missing @Controller() startup failure', async () => {
		const events: DiagnosticEvent[] = []
		const diagnostics: IDiagnosticsEmitter = {
			emit(event) {
				events.push(event)
			}
		}

		await expect(
			Application.create(BrokenControllerModule, {
				startupGuide: { verbose: true },
				diagnostics
			})
		).rejects.toThrow('is not decorated with @Controller()')

		const guideEvent = events.find((event) => event.category === 'startup' && event.message === 'Startup guide')
		expect(guideEvent).toBeDefined()
		expect(
			((guideEvent?.details as Record<string, unknown>)?.hints as string[]).some((hint) =>
				hint.includes('@Controller()')
			)
		).toBe(true)

		expect(
			events.some(
				(event) =>
					event.category === 'startup' &&
					event.level === 'warn' &&
					event.message === 'Startup guide (verbose)'
			)
		).toBe(true)
	})

	test('debug.routes emits per-controller route registration timing diagnostics', async () => {
		const events: DiagnosticEvent[] = []
		const diagnostics: IDiagnosticsEmitter = {
			emit(event) {
				events.push(event)
			}
		}

		await createTestApplication({
			controllers: [DiagnosticsAController, DiagnosticsBController],
			appOptions: {
				debug: { routes: true, startup: false },
				diagnostics
			}
		})

		const controllerEvents = events.filter(
			(event) =>
				event.category === 'routes' &&
				event.level === 'info' &&
				event.message === 'Registered controller routes'
		)

		expect(controllerEvents.length).toBeGreaterThanOrEqual(2)
		expect(
			controllerEvents.every((event) => {
				const details = (event.details || {}) as Record<string, unknown>
				return (
					typeof details.controller === 'string' &&
					Number(details.routeCountAdded) >= 1 &&
					Number(details.registrationDurationMs) >= 0
				)
			})
		).toBe(true)
	})

	test('debug.routes emits per-controller failure diagnostics when registration throws', async () => {
		const events: DiagnosticEvent[] = []
		const diagnostics: IDiagnosticsEmitter = {
			emit(event) {
				events.push(event)
			}
		}

		await expect(
			Application.create(BrokenControllerModule, {
				debug: { routes: true, startup: false },
				diagnostics
			})
		).rejects.toThrow('is not decorated with @Controller()')

		expect(
			events.some(
				(event) =>
					event.category === 'routes' &&
					event.level === 'error' &&
					event.message === 'Failed to register controller routes' &&
					String((event.details as Record<string, unknown>)?.errorMessage || '').includes(
						'is not decorated with @Controller()'
					)
			)
		).toBe(true)
	})

	test('metadata changes after app creation do not affect running app behavior', async () => {
		const testApp = await createControllerTestApplication({
			controller: RuntimeMetadataController
		})

		const InjectedFilter: IFilter = {
			catch(_exception: Error, context: any): Response {
				return context.json({ injected: true }, 418)
			}
		}

		MetadataRegistry.registerHandler('filter', 'RuntimeMetadataController:index', InjectedFilter)

		const res = await testApp.request('/runtime-metadata')
		expect(res.status).toBe(500)
		const body = await res.json()
		expect(body.message).toContain('runtime metadata baseline error')
		expect(body.injected).toBeUndefined()
	})

	test('fails startup on duplicate method/path routes', async () => {
		await expect(
			createTestApplication({ controllers: [DuplicateAController, DuplicateBController] })
		).rejects.toThrow('Duplicate route detected')
	})

	// --- Phase 1 bug fix tests ---

	test('global guards do not leak between sequential Application.create() calls', async () => {
		let guardCalled = false
		const LeakyGuard: IGuard = {
			canActivate() {
				guardCalled = true
				return false
			}
		}

		await createControllerTestApplication({
			controller: OnlyAController,
			appOptions: { components: { guards: [LeakyGuard] } }
		})

		expect(guardCalled).toBe(false)
		guardCalled = false

		const testApp = await createControllerTestApplication({ controller: OnlyBController })
		const res = await testApp.request('/only-b')

		expect(guardCalled).toBe(false)
		expect(res.status).toBe(200)
	})

	test('shared module imported by two parents is registered only once (deduplication)', async () => {
		@Service()
		class SharedService {
			value = Math.random()
		}

		@Controller('/shared')
		class SharedController {
			@Get()
			index() {
				return { ok: true }
			}
		}

		@Module({ controllers: [SharedController], services: [SharedService] })
		class SharedModule {}

		@Controller('/branch-a')
		class BranchAController {
			@Get()
			index() {
				return { branch: 'a' }
			}
		}

		@Module({ controllers: [BranchAController], imports: [SharedModule] })
		class BranchAModule {}

		@Controller('/branch-b')
		class BranchBController {
			@Get()
			index() {
				return { branch: 'b' }
			}
		}

		@Module({ controllers: [BranchBController], imports: [SharedModule] })
		class BranchBModule {}

		@Module({ imports: [BranchAModule, BranchBModule] })
		class DiamondRootModule {}

		const { app } = await Application.create(DiamondRootModule)
		const routes = app.getRoutes()
		const sharedRoutes = routes.filter((r) => r.fullPath.includes('/shared'))
		expect(sharedRoutes.length).toBe(1)
	})

	test('filter that throws returns a 500 instead of silently swallowing', async () => {
		const BrokenFilter: IFilter = {
			catch(): Response {
				throw new Error('filter exploded')
			}
		}

		@Controller('/filter-err')
		@UseFilters(BrokenFilter)
		class FilterErrorController {
			@Get()
			index() {
				throw new Error('original error')
			}
		}

		const testApp = await createControllerTestApplication({
			controller: FilterErrorController
		})
		const res = await testApp.request('/filter-err')

		expect(res.status).toBe(500)
		const body = await res.json()
		expect(body.message).toContain('filter exploded')
	})

	// --- Phase 3 DX improvement tests ---

	test('DI error message tells you to add @Service() when decorator is missing', () => {
		class NotAService {
			constructor(public dep: TestController) {}
		}

		const harness = createServiceTestContainer()
		expect(() => harness.get(NotAService)).toThrow('not decorated with @Service()')
	})

	test('container.has() returns false for unresolved and true after resolve', async () => {
		const harness = createServiceTestContainer()
		expect(harness.has(TestController)).toBe(false)

		harness.get(TestController)
		expect(harness.has(TestController)).toBe(true)
	})

	test('container.clear() removes all cached instances', () => {
		const harness = createServiceTestContainer()
		harness.get(TestController)
		expect(harness.has(TestController)).toBe(true)

		harness.clear()
		expect(harness.has(TestController)).toBe(false)
	})

	// --- Phase 4 architecture tests ---

	test('two apps created in sequence have fully isolated routes', async () => {
		const appA = await createControllerTestApplication({ controller: OnlyAController })
		const appB = await createControllerTestApplication({ controller: OnlyBController })

		expect(appA.app.getRoutes().length).toBe(1)
		expect(appB.app.getRoutes().length).toBe(1)
		expect(appA.app.getRoutes()[0].fullPath).toContain('/only-a')
		expect(appB.app.getRoutes()[0].fullPath).toContain('/only-b')

		const resA = await appA.request('/only-a')
		expect(resA.status).toBe(200)
		expect(await resA.json()).toEqual({ app: 'a' })

		const resB = await appB.request('/only-b')
		expect(resB.status).toBe(200)
		expect(await resB.json()).toEqual({ app: 'b' })
	})

	test('global filters are isolated between apps', async () => {
		let filterHitCount = 0
		const CountingFilter: IFilter = {
			catch(exception: any, context: any): Response {
				filterHitCount++
				return context.json({ filtered: true }, 500)
			}
		}

		@Controller('/err')
		class ErrController {
			@Get()
			index() {
				throw new Error('boom')
			}
		}

		const app1 = await createControllerTestApplication({
			controller: ErrController,
			appOptions: { components: { filters: [CountingFilter] } }
		})
		await app1.request('/err')
		expect(filterHitCount).toBe(1)

		filterHitCount = 0
		const app2 = await createControllerTestApplication({ controller: ErrController })
		const res = await app2.request('/err')
		expect(filterHitCount).toBe(0)
		expect(res.status).toBe(500)
	})

	test('DI containers are isolated between apps', async () => {
		@Service()
		class CounterService {
			count = 0
		}

		@Controller('/counter')
		class CounterController {
			constructor(private svc: CounterService) {}
			@Get()
			index() {
				this.svc.count++
				return { count: this.svc.count }
			}
		}

		const app1 = await createControllerTestApplication({
			controller: CounterController,
			services: [CounterService]
		})
		await app1.request('/counter')
		const res1 = await app1.request('/counter')
		expect((await res1.json()).count).toBe(2)

		const app2 = await createControllerTestApplication({
			controller: CounterController,
			services: [CounterService]
		})
		const res2 = await app2.request('/counter')
		expect((await res2.json()).count).toBe(1)
	})
})
