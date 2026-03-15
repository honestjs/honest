import 'reflect-metadata'
import { afterEach, describe, expect, test } from 'bun:test'
import { Application } from './application'
import { Body, Controller, Get, Module, Post, Service, UseFilters } from './decorators'
import { Container } from './di/container'
import { createParamDecorator } from './helpers'
import type { IFilter, IGuard } from './interfaces'
import { ComponentManager } from './managers'
import { RouteRegistry } from './registries/route.registry'

@Controller('/health')
class TestController {
	@Get()
	index() {
		return { ok: true }
	}
}

@Module({ controllers: [TestController] })
class TestModule {}

@Controller('/payload')
class PayloadController {
	@Post('echo')
	async echo(@Body('a') a: string, @Body('b') b: string) {
		return { a, b }
	}
}

@Module({ controllers: [PayloadController] })
class PayloadModule {}

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

@Module({ controllers: [RawResponseController] })
class RawResponseModule {}

@Controller('/only-a')
class OnlyAController {
	@Get()
	index() {
		return { app: 'a' }
	}
}

@Module({ controllers: [OnlyAController] })
class OnlyAModule {}

@Controller('/only-b')
class OnlyBController {
	@Get()
	index() {
		return { app: 'b' }
	}
}

@Module({ controllers: [OnlyBController] })
class OnlyBModule {}

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

@Module({ controllers: [DuplicateAController, DuplicateBController] })
class DuplicateRoutesModule {}

const UnsafeParam = createParamDecorator('unsafe')

@Controller('/unsafe')
class UnsafeParamController {
	@Get()
	check(@UnsafeParam() value: unknown) {
		return { hasValue: value !== undefined }
	}
}

@Module({ controllers: [UnsafeParamController] })
class UnsafeParamModule {}

describe('Application', () => {
	afterEach(() => {
		RouteRegistry.clear()
	})

	test('create() registers module and getRoutes() returns expected route', async () => {
		const { app, hono } = await Application.create(TestModule)

		const routes = app.getRoutes()
		expect(routes.length).toBeGreaterThanOrEqual(1)
		const getRoute = routes.find((r) => r.method.toUpperCase() === 'GET' && r.fullPath.includes('health'))
		expect(getRoute).toBeDefined()
		expect(getRoute!.method.toUpperCase()).toBe('GET')

		const path = getRoute!.fullPath
		const res = await hono.request(new Request(`http://localhost${path}`))
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body).toEqual({ ok: true })
	})

	test('getContext() returns same instance and supports set/get', async () => {
		const { app } = await Application.create(TestModule)
		const ctx = app.getContext()
		expect(ctx).toBe(app.getContext())

		ctx.set('test.key', { value: 123 })
		expect(ctx.get<{ value: number }>('test.key')).toEqual({ value: 123 })
		expect(ctx.has('test.key')).toBe(true)
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
		await Application.create(TestModule, { plugins: [TestPlugin] })
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
		await Application.create(TestModule, {
			plugins: [
				{
					plugin: TestPlugin,
					preProcessors: [pre1, pre2],
					postProcessors: [post1]
				}
			]
		})
		expect(order).toEqual(['pre1', 'pre2', 'before', 'after', 'post1'])
	})

	test('@Body() values are readable multiple times in one handler', async () => {
		const { hono } = await Application.create(PayloadModule)
		const res = await hono.request(
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
		const { hono } = await Application.create(RawResponseModule)
		const res = await hono.request(new Request('http://localhost/raw'))

		expect(res.status).toBe(201)
		expect(res.headers.get('x-honest')).toBe('yes')
		expect(await res.text()).toBe('raw-ok')
	})

	test('creating a new app resets RouteRegistry route list', async () => {
		const { app: appA } = await Application.create(OnlyAModule)
		expect(appA.getRoutes().some((route) => route.fullPath.includes('/only-a'))).toBe(true)

		const { app: appB } = await Application.create(OnlyBModule)
		expect(appB.getRoutes().some((route) => route.fullPath.includes('/only-b'))).toBe(true)
		expect(appB.getRoutes().some((route) => route.fullPath.includes('/only-a'))).toBe(false)
	})

	test('custom param decorator without factory uses safe fallback', async () => {
		const { hono } = await Application.create(UnsafeParamModule)
		const res = await hono.request(new Request('http://localhost/unsafe'))

		expect(res.status).toBe(200)
		expect(await res.json()).toEqual({ hasValue: true })
	})

	test('fails with clear message for controllers missing @Controller()', async () => {
		await expect(Application.create(BrokenControllerModule)).rejects.toThrow('is not decorated with @Controller()')
	})

	test('strict.requireRoutes fails startup when no routes are registered', async () => {
		await expect(Application.create(EmptyModule, { strict: { requireRoutes: true } })).rejects.toThrow(
			'Strict mode: no routes were registered'
		)
	})

	test('fails startup on duplicate method/path routes', async () => {
		await expect(Application.create(DuplicateRoutesModule)).rejects.toThrow('Duplicate route detected')
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

		// First app: register a global guard that rejects everything
		await Application.create(OnlyAModule, {
			components: { guards: [LeakyGuard] }
		})

		guardCalled = false

		// Second app: no global guard — the guard from the first app must NOT leak
		const { hono } = await Application.create(OnlyBModule)
		const res = await hono.request(new Request('http://localhost/only-b'))

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

		// Should not throw "Duplicate route detected" for /shared
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

		@Module({ controllers: [FilterErrorController] })
		class FilterErrorModule {}

		const { hono } = await Application.create(FilterErrorModule)
		const res = await hono.request(new Request('http://localhost/filter-err'))

		expect(res.status).toBe(500)
		const body = await res.json()
		expect(body.message).toContain('filter exploded')
	})

	// --- Phase 3 DX improvement tests ---

	test('DI error message tells you to add @Service() when decorator is missing', () => {
		class NotAService {
			constructor(public dep: TestController) {}
		}

		const container = new Container()
		expect(() => container.resolve(NotAService)).toThrow('not decorated with @Service()')
	})

	test('container.has() returns false for unresolved and true after resolve', async () => {
		const container = new Container()
		expect(container.has(TestController)).toBe(false)

		container.resolve(TestController)
		expect(container.has(TestController)).toBe(true)
	})

	test('container.clear() removes all cached instances', () => {
		const container = new Container()
		container.resolve(TestController)
		expect(container.has(TestController)).toBe(true)

		container.clear()
		expect(container.has(TestController)).toBe(false)
	})

	test('ComponentManager methods throw before init() is called', () => {
		// Reset ComponentManager by re-initializing with undefined
		// We access the static container via casting to test the guard
		const original = (ComponentManager as any).container
		;(ComponentManager as any).container = undefined

		expect(() => ComponentManager.resolveMiddleware([])).toThrow('not initialized')
		expect(() => ComponentManager.resolveGuards([])).toThrow('not initialized')
		expect(() => ComponentManager.resolvePipes([])).toThrow('not initialized')

		// Restore
		;(ComponentManager as any).container = original
	})
})
