import 'reflect-metadata'
import { afterEach, describe, expect, test } from 'bun:test'
import { MetadataRegistry } from './metadata.registry'

class FakeController {}
class FakeService {}
class FakeModule {}

const fakeGuard = { canActivate: () => true }
const fakeFilter = { catch: () => undefined }
const fakePipe = { transform: (v: unknown) => v }
const fakeMiddleware = { use: async () => {} }

afterEach(() => {
	MetadataRegistry.clear()
})

describe('MetadataRegistry', () => {
	describe('routes', () => {
		test('addRoute / getRoutes round-trips', () => {
			const route = { path: '/test', method: 'GET', handlerName: 'index' }
			MetadataRegistry.addRoute(FakeController, route)
			expect(MetadataRegistry.getRoutes(FakeController)).toEqual([route])
		})

		test('setRoutes overwrites existing routes', () => {
			MetadataRegistry.addRoute(FakeController, { path: '/old', method: 'GET', handlerName: 'old' })
			const newRoutes = [{ path: '/new', method: 'POST', handlerName: 'create' }]
			MetadataRegistry.setRoutes(FakeController, newRoutes)
			expect(MetadataRegistry.getRoutes(FakeController)).toEqual(newRoutes)
		})

		test('getRoutes returns empty array for unknown controller', () => {
			expect(MetadataRegistry.getRoutes(FakeController)).toEqual([])
		})
	})

	describe('controllers', () => {
		test('setControllerPath / getControllerPath round-trips', () => {
			MetadataRegistry.setControllerPath(FakeController, '/users')
			expect(MetadataRegistry.getControllerPath(FakeController)).toBe('/users')
		})

		test('hasController returns true only after registration', () => {
			expect(MetadataRegistry.hasController(FakeController)).toBe(false)
			MetadataRegistry.setControllerPath(FakeController, '/x')
			expect(MetadataRegistry.hasController(FakeController)).toBe(true)
		})

		test('getControllerPath returns empty string for unknown', () => {
			expect(MetadataRegistry.getControllerPath(FakeController)).toBe('')
		})
	})

	describe('controller options', () => {
		test('setControllerOptions / getControllerOptions round-trips', () => {
			const opts = { prefix: '/api', version: 2 }
			MetadataRegistry.setControllerOptions(FakeController, opts)
			expect(MetadataRegistry.getControllerOptions(FakeController)).toEqual(opts)
		})

		test('getControllerOptions returns empty object for unknown', () => {
			expect(MetadataRegistry.getControllerOptions(FakeController)).toEqual({})
		})
	})

	describe('services', () => {
		test('addService / isService round-trips', () => {
			expect(MetadataRegistry.isService(FakeService)).toBe(false)
			MetadataRegistry.addService(FakeService)
			expect(MetadataRegistry.isService(FakeService)).toBe(true)
		})

		test('getAllServices returns the set', () => {
			MetadataRegistry.addService(FakeService)
			const services = MetadataRegistry.getAllServices()
			expect(services.has(FakeService)).toBe(true)
		})
	})

	describe('modules', () => {
		test('setModuleOptions / getModuleOptions round-trips', () => {
			const opts = { controllers: [FakeController] }
			MetadataRegistry.setModuleOptions(FakeModule, opts)
			expect(MetadataRegistry.getModuleOptions(FakeModule)).toEqual(opts)
		})

		test('getModuleOptions returns undefined for unknown module', () => {
			expect(MetadataRegistry.getModuleOptions(FakeModule)).toBeUndefined()
		})
	})

	describe('parameters', () => {
		test('setParameterMap / getParameters round-trips', () => {
			const params = new Map([
				['index', [{ index: 0, name: 'body', data: undefined, factory: () => {}, metatype: String }]]
			])
			MetadataRegistry.setParameterMap(FakeController, params as any)
			expect(MetadataRegistry.getParameters(FakeController).get('index')).toHaveLength(1)
		})

		test('getParameters returns empty map for unknown', () => {
			const map = MetadataRegistry.getParameters(FakeController)
			expect(map.size).toBe(0)
		})
	})

	describe('context indices', () => {
		test('setContextIndices / getContextIndices round-trips', () => {
			const indices = new Map<string | symbol, number>([['handler', 0]])
			MetadataRegistry.setContextIndices(FakeController, indices)
			expect(MetadataRegistry.getContextIndices(FakeController).get('handler')).toBe(0)
		})

		test('getContextIndices returns empty map for unknown', () => {
			expect(MetadataRegistry.getContextIndices(FakeController).size).toBe(0)
		})
	})

	describe('component registration — controller level', () => {
		test('registerController / getController for guards', () => {
			MetadataRegistry.registerController('guard', FakeController, fakeGuard as any)
			expect(MetadataRegistry.getController('guard', FakeController)).toEqual([fakeGuard])
		})

		test('getController returns empty array for unregistered', () => {
			expect(MetadataRegistry.getController('pipe', FakeController)).toEqual([])
		})

		test('multiple components accumulate', () => {
			MetadataRegistry.registerController('filter', FakeController, fakeFilter as any)
			MetadataRegistry.registerController('filter', FakeController, fakeFilter as any)
			expect(MetadataRegistry.getController('filter', FakeController)).toHaveLength(2)
		})
	})

	describe('component registration — handler level', () => {
		test('registerHandler / getHandler round-trips', () => {
			MetadataRegistry.registerHandler('middleware', 'Ctrl:index', fakeMiddleware as any)
			expect(MetadataRegistry.getHandler('middleware', 'Ctrl:index')).toEqual([fakeMiddleware])
		})

		test('getHandler returns empty array for unregistered key', () => {
			expect(MetadataRegistry.getHandler('guard', 'Unknown:method')).toEqual([])
		})
	})

	describe('clear()', () => {
		test('resets all data', () => {
			MetadataRegistry.addRoute(FakeController, { path: '/', method: 'GET', handlerName: 'x' })
			MetadataRegistry.setControllerPath(FakeController, '/c')
			MetadataRegistry.setControllerOptions(FakeController, { prefix: '/p' })
			MetadataRegistry.addService(FakeService)
			MetadataRegistry.setModuleOptions(FakeModule, {})
			MetadataRegistry.setParameterMap(FakeController, new Map())
			MetadataRegistry.setContextIndices(FakeController, new Map())
			MetadataRegistry.registerController('guard', FakeController, fakeGuard as any)
			MetadataRegistry.registerHandler('pipe', 'k', fakePipe as any)

			MetadataRegistry.clear()

			expect(MetadataRegistry.getRoutes(FakeController)).toEqual([])
			expect(MetadataRegistry.hasController(FakeController)).toBe(false)
			expect(MetadataRegistry.isService(FakeService)).toBe(false)
			expect(MetadataRegistry.getModuleOptions(FakeModule)).toBeUndefined()
			expect(MetadataRegistry.getController('guard', FakeController)).toEqual([])
			expect(MetadataRegistry.getHandler('pipe', 'k')).toEqual([])
		})
	})
})
