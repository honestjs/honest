import 'reflect-metadata'
import { afterEach, describe, expect, test } from 'bun:test'
import { Application } from './application'
import { Controller, Get, Module } from './decorators'
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
})
