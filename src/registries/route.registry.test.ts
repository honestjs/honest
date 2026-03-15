import { describe, expect, test } from 'bun:test'
import type { RouteInfo } from '../interfaces'
import { RouteRegistry } from './route.registry'

function makeRouteInfo(overrides: Partial<RouteInfo> = {}): RouteInfo {
	return {
		controller: 'TestController',
		handler: 'index',
		method: 'GET',
		prefix: '',
		route: '/test',
		path: '',
		fullPath: '/test',
		parameters: [],
		...overrides
	}
}

describe('RouteRegistry', () => {
	describe('registerRoute', () => {
		test('appends valid route and getRoutes returns it', () => {
			const registry = new RouteRegistry()
			const route = makeRouteInfo()
			registry.registerRoute(route)
			const routes = registry.getRoutes()
			expect(routes).toHaveLength(1)
			expect(routes[0]).toEqual(route)
		})

		test('throws when route info is null', () => {
			const registry = new RouteRegistry()
			expect(() => registry.registerRoute(null as unknown as RouteInfo)).toThrow('Route info is required')
		})

		test('throws when route info is undefined', () => {
			const registry = new RouteRegistry()
			expect(() => registry.registerRoute(undefined as unknown as RouteInfo)).toThrow('Route info is required')
		})

		test('throws when controller is missing', () => {
			const registry = new RouteRegistry()
			expect(() => registry.registerRoute(makeRouteInfo({ controller: undefined }))).toThrow(
				'Route controller is required'
			)
		})

		test('throws when handler is missing', () => {
			const registry = new RouteRegistry()
			expect(() => registry.registerRoute(makeRouteInfo({ handler: undefined }))).toThrow(
				'Route handler is required'
			)
		})

		test('throws when method is missing', () => {
			const registry = new RouteRegistry()
			expect(() => registry.registerRoute(makeRouteInfo({ method: undefined }))).toThrow(
				'Route method is required'
			)
		})

		test('throws when fullPath is missing', () => {
			const registry = new RouteRegistry()
			expect(() => registry.registerRoute(makeRouteInfo({ fullPath: undefined }))).toThrow(
				'Route fullPath is required'
			)
		})

		test('throws when a duplicate method/path route is registered', () => {
			const registry = new RouteRegistry()
			registry.registerRoute(makeRouteInfo({ method: 'GET', fullPath: '/dup' }))
			expect(() => registry.registerRoute(makeRouteInfo({ method: 'GET', fullPath: '/dup' }))).toThrow(
				'Duplicate route detected'
			)
		})
	})

	describe('getRoutesByController', () => {
		test('returns routes for given controller', () => {
			const registry = new RouteRegistry()
			registry.registerRoute(makeRouteInfo({ controller: 'A', fullPath: '/a1' }))
			registry.registerRoute(makeRouteInfo({ controller: 'A', fullPath: '/a2' }))
			registry.registerRoute(makeRouteInfo({ controller: 'B', fullPath: '/b1' }))
			const forA = registry.getRoutesByController('A')
			expect(forA).toHaveLength(2)
			expect(forA.map((r) => r.fullPath)).toEqual(['/a1', '/a2'])
			const forB = registry.getRoutesByController('B')
			expect(forB).toHaveLength(1)
			expect(forB[0].fullPath).toBe('/b1')
		})
	})

	describe('getRoutesByMethod', () => {
		test('returns routes for given method (case-insensitive)', () => {
			const registry = new RouteRegistry()
			registry.registerRoute(makeRouteInfo({ method: 'GET', fullPath: '/get' }))
			registry.registerRoute(makeRouteInfo({ method: 'POST', fullPath: '/post' }))
			registry.registerRoute(makeRouteInfo({ method: 'GET', fullPath: '/get2' }))
			const getRoutes = registry.getRoutesByMethod('GET')
			expect(getRoutes).toHaveLength(2)
			expect(getRoutes.map((r) => r.fullPath)).toEqual(['/get', '/get2'])
			const getLower = registry.getRoutesByMethod('get')
			expect(getLower).toHaveLength(2)
		})
	})

	describe('getRoutesByPath', () => {
		test('returns routes matching pattern', () => {
			const registry = new RouteRegistry()
			registry.registerRoute(makeRouteInfo({ fullPath: '/api/users' }))
			registry.registerRoute(makeRouteInfo({ fullPath: '/api/posts' }))
			const userRoutes = registry.getRoutesByPath(/users/)
			expect(userRoutes).toHaveLength(1)
			expect(userRoutes[0].fullPath).toBe('/api/users')
		})
	})

	describe('clear', () => {
		test('removes all routes', () => {
			const registry = new RouteRegistry()
			registry.registerRoute(makeRouteInfo())
			registry.clear()
			expect(registry.getRoutes()).toHaveLength(0)
		})
	})
})
