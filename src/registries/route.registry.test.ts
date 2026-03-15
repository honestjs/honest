import { afterEach, describe, expect, test } from 'bun:test'
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
	afterEach(() => {
		RouteRegistry.clear()
	})

	describe('registerRoute', () => {
		test('appends valid route and getRoutes returns it', () => {
			const route = makeRouteInfo()
			RouteRegistry.registerRoute(route)
			const routes = RouteRegistry.getRoutes()
			expect(routes).toHaveLength(1)
			expect(routes[0]).toEqual(route)
		})

		test('throws when route info is null', () => {
			expect(() => RouteRegistry.registerRoute(null as unknown as RouteInfo)).toThrow('Route info is required')
		})

		test('throws when route info is undefined', () => {
			expect(() => RouteRegistry.registerRoute(undefined as unknown as RouteInfo)).toThrow(
				'Route info is required'
			)
		})

		test('throws when controller is missing', () => {
			expect(() => RouteRegistry.registerRoute(makeRouteInfo({ controller: undefined }))).toThrow(
				'Route controller is required'
			)
		})

		test('throws when handler is missing', () => {
			expect(() => RouteRegistry.registerRoute(makeRouteInfo({ handler: undefined }))).toThrow(
				'Route handler is required'
			)
		})

		test('throws when method is missing', () => {
			expect(() => RouteRegistry.registerRoute(makeRouteInfo({ method: undefined }))).toThrow(
				'Route method is required'
			)
		})

		test('throws when fullPath is missing', () => {
			expect(() => RouteRegistry.registerRoute(makeRouteInfo({ fullPath: undefined }))).toThrow(
				'Route fullPath is required'
			)
		})

		test('throws when a duplicate method/path route is registered', () => {
			RouteRegistry.registerRoute(makeRouteInfo({ method: 'GET', fullPath: '/dup' }))
			expect(() => RouteRegistry.registerRoute(makeRouteInfo({ method: 'GET', fullPath: '/dup' }))).toThrow(
				'Duplicate route detected'
			)
		})
	})

	describe('getRoutesByController', () => {
		test('returns routes for given controller', () => {
			RouteRegistry.registerRoute(makeRouteInfo({ controller: 'A', fullPath: '/a1' }))
			RouteRegistry.registerRoute(makeRouteInfo({ controller: 'A', fullPath: '/a2' }))
			RouteRegistry.registerRoute(makeRouteInfo({ controller: 'B', fullPath: '/b1' }))
			const forA = RouteRegistry.getRoutesByController('A')
			expect(forA).toHaveLength(2)
			expect(forA.map((r) => r.fullPath)).toEqual(['/a1', '/a2'])
			const forB = RouteRegistry.getRoutesByController('B')
			expect(forB).toHaveLength(1)
			expect(forB[0].fullPath).toBe('/b1')
		})
	})

	describe('getRoutesByMethod', () => {
		test('returns routes for given method (case-insensitive)', () => {
			RouteRegistry.registerRoute(makeRouteInfo({ method: 'GET', fullPath: '/get' }))
			RouteRegistry.registerRoute(makeRouteInfo({ method: 'POST', fullPath: '/post' }))
			RouteRegistry.registerRoute(makeRouteInfo({ method: 'GET', fullPath: '/get2' }))
			const getRoutes = RouteRegistry.getRoutesByMethod('GET')
			expect(getRoutes).toHaveLength(2)
			expect(getRoutes.map((r) => r.fullPath)).toEqual(['/get', '/get2'])
			const getLower = RouteRegistry.getRoutesByMethod('get')
			expect(getLower).toHaveLength(2)
		})
	})

	describe('getRoutesByPath', () => {
		test('returns routes matching pattern', () => {
			RouteRegistry.registerRoute(makeRouteInfo({ fullPath: '/api/users' }))
			RouteRegistry.registerRoute(makeRouteInfo({ fullPath: '/api/posts' }))
			const userRoutes = RouteRegistry.getRoutesByPath(/users/)
			expect(userRoutes).toHaveLength(1)
			expect(userRoutes[0].fullPath).toBe('/api/users')
		})
	})

	describe('clear', () => {
		test('removes all routes', () => {
			RouteRegistry.registerRoute(makeRouteInfo())
			RouteRegistry.clear()
			expect(RouteRegistry.getRoutes()).toHaveLength(0)
		})
	})
})
