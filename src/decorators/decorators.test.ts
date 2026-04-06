import 'reflect-metadata'
import { afterEach, describe, expect, test } from 'bun:test'
import { MetadataRegistry } from '../registries'
import { Controller } from './controller.decorator'
import { Module } from './module.decorator'
import { Service } from './service.decorator'
import { Get, Post, Put, Delete, Patch } from './http-method.decorator'
import { UseGuards } from './use-guards.decorator'
import { UsePipes } from './use-pipes.decorator'
import { UseFilters } from './use-filters.decorator'
import { UseMiddleware } from './use-middleware.decorator'

afterEach(() => {
	MetadataRegistry.clear()
})

describe('@Controller', () => {
	test('sets path in MetadataRegistry', () => {
		@Controller('/users')
		class UsersController {}
		expect(MetadataRegistry.getControllerPath(UsersController)).toBe('/users')
		expect(MetadataRegistry.hasController(UsersController)).toBe(true)
	})

	test('defaults to empty string when no path given', () => {
		@Controller()
		class DefaultController {}
		expect(MetadataRegistry.getControllerPath(DefaultController)).toBe('')
	})

	test('stores controller options', () => {
		@Controller('/api', { prefix: '/v2', version: 3 })
		class VersionedController {}
		const opts = MetadataRegistry.getControllerOptions(VersionedController)
		expect(opts.prefix).toBe('/v2')
		expect(opts.version).toBe(3)
	})
})

describe('@Module', () => {
	test('sets module options in MetadataRegistry', () => {
		class SomeController {}
		@Module({ controllers: [SomeController] })
		class AppModule {}
		const opts = MetadataRegistry.getModuleOptions(AppModule)
		expect(opts).toBeDefined()
		expect(opts!.controllers).toEqual([SomeController])
	})

	test('defaults to empty options', () => {
		@Module()
		class EmptyModule {}
		expect(MetadataRegistry.getModuleOptions(EmptyModule)).toEqual({})
	})
})

describe('@Service', () => {
	test('adds class to services set', () => {
		@Service()
		class MyService {}
		expect(MetadataRegistry.isService(MyService)).toBe(true)
	})
})

describe('HTTP method decorators', () => {
	test('@Get registers get route', () => {
		class Ctrl {
			@Get('/items')
			getItems() {}
		}
		const routes = MetadataRegistry.getRoutes(Ctrl)
		expect(routes).toHaveLength(1)
		expect(routes[0].method).toBe('get')
		expect(routes[0].path).toBe('/items')
		expect(routes[0].handlerName).toBe('getItems')
	})

	test('@Post registers post route', () => {
		class Ctrl {
			@Post('/items')
			create() {}
		}
		expect(MetadataRegistry.getRoutes(Ctrl)[0].method).toBe('post')
	})

	test('@Put registers put route', () => {
		class Ctrl {
			@Put('/items/:id')
			update() {}
		}
		expect(MetadataRegistry.getRoutes(Ctrl)[0].method).toBe('put')
	})

	test('@Delete registers delete route', () => {
		class Ctrl {
			@Delete('/items/:id')
			remove() {}
		}
		expect(MetadataRegistry.getRoutes(Ctrl)[0].method).toBe('delete')
	})

	test('@Patch registers patch route', () => {
		class Ctrl {
			@Patch('/items/:id')
			patch() {}
		}
		expect(MetadataRegistry.getRoutes(Ctrl)[0].method).toBe('patch')
	})

	test('defaults to empty path', () => {
		class Ctrl {
			@Get()
			index() {}
		}
		expect(MetadataRegistry.getRoutes(Ctrl)[0].path).toBe('')
	})

	test('version and prefix options are stored', () => {
		class Ctrl {
			@Get('/x', { version: 2, prefix: '/api' })
			x() {}
		}
		const route = MetadataRegistry.getRoutes(Ctrl)[0]
		expect(route.version).toBe(2)
		expect(route.prefix).toBe('/api')
	})
})

describe('@UseGuards', () => {
	const fakeGuard = { canActivate: () => true }

	test('registers at controller level', () => {
		@UseGuards(fakeGuard as any)
		class Ctrl {}
		expect(MetadataRegistry.getController('guard', Ctrl)).toEqual([fakeGuard])
	})

	test('registers at handler level', () => {
		class Ctrl {
			@UseGuards(fakeGuard as any)
			index() {}
		}
		void Ctrl
		expect(MetadataRegistry.getHandler('guard', Ctrl, 'index')).toEqual([fakeGuard])
	})
})

describe('@UsePipes', () => {
	const fakePipe = { transform: (v: unknown) => v }

	test('registers at controller level', () => {
		@UsePipes(fakePipe as any)
		class Ctrl {}
		expect(MetadataRegistry.getController('pipe', Ctrl)).toEqual([fakePipe])
	})

	test('registers at handler level', () => {
		class Ctrl {
			@UsePipes(fakePipe as any)
			index() {}
		}
		void Ctrl
		expect(MetadataRegistry.getHandler('pipe', Ctrl, 'index')).toEqual([fakePipe])
	})
})

describe('@UseFilters', () => {
	const fakeFilter = { catch: () => undefined }

	test('registers at controller level', () => {
		@UseFilters(fakeFilter as any)
		class Ctrl {}
		expect(MetadataRegistry.getController('filter', Ctrl)).toEqual([fakeFilter])
	})

	test('registers at handler level', () => {
		class Ctrl {
			@UseFilters(fakeFilter as any)
			index() {}
		}
		void Ctrl
		expect(MetadataRegistry.getHandler('filter', Ctrl, 'index')).toEqual([fakeFilter])
	})
})

describe('@UseMiddleware', () => {
	const fakeMw = { use: async () => {} }

	test('registers at controller level', () => {
		@UseMiddleware(fakeMw as any)
		class Ctrl {}
		expect(MetadataRegistry.getController('middleware', Ctrl)).toEqual([fakeMw])
	})

	test('registers at handler level', () => {
		class Ctrl {
			@UseMiddleware(fakeMw as any)
			index() {}
		}
		void Ctrl
		expect(MetadataRegistry.getHandler('middleware', Ctrl, 'index')).toEqual([fakeMw])
	})
})
