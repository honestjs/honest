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
})
