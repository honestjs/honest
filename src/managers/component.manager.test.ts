import 'reflect-metadata'
import { afterEach, describe, expect, test } from 'bun:test'
import { ComponentManager } from './component.manager'
import { MetadataRegistry } from '../registries'
import { Container } from '../di/container'
import type { IFilter, IGuard, IMiddleware, IPipe } from '../interfaces'
import { Module, Service } from '../decorators'

afterEach(() => {
	MetadataRegistry.clear()
})

function makeManager() {
	const container = new Container()
	return new ComponentManager(container)
}

const fakeMiddleware: IMiddleware = {
	async use(_c, next) {
		await next()
	}
}
const fakeGuard: IGuard = {
	canActivate() {
		return true
	}
}
const fakePipe: IPipe = {
	transform(v) {
		return v
	}
}
const fakeFilter: IFilter = {
	catch() {
		return undefined
	}
}

describe('ComponentManager', () => {
	describe('setupGlobalComponents', () => {
		test('registers all component types', () => {
			const cm = makeManager()
			cm.setupGlobalComponents({
				components: {
					middleware: [fakeMiddleware],
					guards: [fakeGuard],
					pipes: [fakePipe],
					filters: [fakeFilter]
				}
			})
			expect(cm.getGlobal('middleware').size).toBe(1)
			expect(cm.getGlobal('guard').size).toBe(1)
			expect(cm.getGlobal('pipe').size).toBe(1)
			expect(cm.getGlobal('filter').size).toBe(1)
		})

		test('handles empty options', () => {
			const cm = makeManager()
			cm.setupGlobalComponents({})
			expect(cm.getGlobal('middleware').size).toBe(0)
		})
	})

	describe('getComponents', () => {
		test('merges global + controller + handler in correct order', () => {
			const cm = makeManager()
			const globalGuard: IGuard = { canActivate: () => true }
			const ctrlGuard: IGuard = { canActivate: () => true }
			const handlerGuard: IGuard = { canActivate: () => true }

			cm.registerGlobal('guard', globalGuard)

			class FakeCtrl {}
			MetadataRegistry.registerController('guard', FakeCtrl, ctrlGuard)
			MetadataRegistry.registerHandler('guard', 'FakeCtrl:index', handlerGuard)

			const result = cm.getComponents('guard', FakeCtrl, 'index')
			expect(result).toEqual([globalGuard, ctrlGuard, handlerGuard])
		})
	})

	describe('resolveMiddleware', () => {
		test('handles instances', () => {
			const cm = makeManager()
			const resolved = cm.resolveMiddleware([fakeMiddleware])
			expect(resolved).toHaveLength(1)
			expect(typeof resolved[0]).toBe('function')
		})

		test('handles classes via DI', () => {
			const container = new Container()
			const cm = new ComponentManager(container)
			@Service()
			class TestMiddleware implements IMiddleware {
				async use(_c: any, next: any) {
					await next()
				}
			}
			const resolved = cm.resolveMiddleware([TestMiddleware])
			expect(resolved).toHaveLength(1)
		})
	})

	describe('resolveGuards', () => {
		test('handles instances', () => {
			const cm = makeManager()
			const resolved = cm.resolveGuards([fakeGuard])
			expect(resolved).toEqual([fakeGuard])
		})

		test('handles classes via DI', () => {
			const container = new Container()
			const cm = new ComponentManager(container)
			@Service()
			class TestGuard implements IGuard {
				canActivate(_context: any) {
					return true
				}
			}
			const resolved = cm.resolveGuards([TestGuard])
			expect(resolved).toHaveLength(1)
			expect(resolved[0].canActivate({} as any)).toBe(true)
		})
	})

	describe('resolvePipes', () => {
		test('handles instances', () => {
			const cm = makeManager()
			const resolved = cm.resolvePipes([fakePipe])
			expect(resolved).toEqual([fakePipe])
		})
	})

	describe('executePipes', () => {
		test('chains pipe transforms in order', async () => {
			const cm = makeManager()
			const pipe1: IPipe = { transform: (v: any) => `${v}+A` }
			const pipe2: IPipe = { transform: (v: any) => `${v}+B` }
			const metadata = { name: 'body', metatype: String, data: undefined } as any
			const result = await cm.executePipes('start', metadata, [pipe1, pipe2])
			expect(result).toBe('start+A+B')
		})
	})

	describe('registerModule', () => {
		test('recursive registration', async () => {
			const cm = makeManager()

			class ChildCtrl {}
			MetadataRegistry.setControllerPath(ChildCtrl, '/child')

			@Module({ controllers: [ChildCtrl] })
			class ChildModule {}

			@Module({ imports: [ChildModule] })
			class ParentModule {}

			const controllers = await cm.registerModule(ParentModule)
			expect(controllers).toContain(ChildCtrl)
		})

		test('throws for undecorated module', async () => {
			const cm = makeManager()
			class NotAModule {}
			await expect(cm.registerModule(NotAModule)).rejects.toThrow('not properly decorated with @Module()')
		})
	})
})
