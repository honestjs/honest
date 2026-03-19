import 'reflect-metadata'
import { describe, expect, test } from 'bun:test'
import { Service } from '../decorators'
import type { DiagnosticEvent, IDiagnosticsEmitter, IServiceRegistry } from '../interfaces'
import { Container } from './container'

describe('Container', () => {
	test('resolve() returns same instance for class with no deps (singleton)', () => {
		class NoDeps {}
		const container = new Container()
		const a = container.resolve(NoDeps)
		const b = container.resolve(NoDeps)
		expect(a).toBe(b)
		expect(a).toBeInstanceOf(NoDeps)
	})

	test('resolve() injects dependency when constructor has one param', () => {
		class Dep {}
		class WithDep {
			constructor(public dep: Dep) {}
		}
		Reflect.defineMetadata('design:paramtypes', [Dep], WithDep)

		const container = new Container()
		const instance = container.resolve(WithDep)
		expect(instance).toBeInstanceOf(WithDep)
		expect(instance.dep).toBeInstanceOf(Dep)
		expect(instance.dep).toBe(container.resolve(Dep))
	})

	test('resolve() throws when circular dependency is detected', () => {
		class CircularA {
			constructor(_b: CircularB) {}
		}
		class CircularB {
			constructor(_a: CircularA) {}
		}
		Reflect.defineMetadata('design:paramtypes', [CircularB], CircularA)
		Reflect.defineMetadata('design:paramtypes', [CircularA], CircularB)

		const container = new Container()
		expect(() => container.resolve(CircularA)).toThrow('Circular dependency detected')
	})

	test('register() allows pre-created instance; resolve() returns it', () => {
		class Service {}
		const container = new Container()
		const instance = new Service()
		container.register(Service, instance)
		expect(container.resolve(Service)).toBe(instance)
	})

	test('resolve() tells you to add @Service() when decorator is missing', () => {
		class NeedsDep {
			constructor(_dep: unknown) {}
		}

		const container = new Container()
		expect(() => container.resolve(NeedsDep)).toThrow('not decorated with @Service()')
	})

	test('resolve() shows metadata error for decorated class with missing reflect-metadata', () => {
		@Service()
		class DecoratedButNoMeta {
			constructor(_dep: unknown) {}
		}
		// Clear the paramtypes that TypeScript might have emitted
		Reflect.deleteMetadata('design:paramtypes', DecoratedButNoMeta)

		const container = new Container()
		expect(() => container.resolve(DecoratedButNoMeta)).toThrow('constructor metadata is missing')
	})

	test('resolve() throws clear error for non-class dependency metadata', () => {
		class BadDepController {
			constructor(_dep: unknown) {}
		}
		Reflect.defineMetadata('design:paramtypes', [Object], BadDepController)

		const container = new Container()
		expect(() => container.resolve(BadDepController)).toThrow('Cannot resolve dependency at index 0')
	})

	test('resolve() uses injected service registry contract', () => {
		class NeedsDep {
			constructor(_dep: unknown) {}
		}

		const serviceRegistry: IServiceRegistry = {
			isService() {
				return true
			}
		}

		const container = new Container(serviceRegistry)
		expect(() => container.resolve(NeedsDep)).toThrow('constructor metadata is missing')
	})

	test('resolve() emits DI diagnostics when debug mode is enabled', () => {
		class Dependency {}
		class Consumer {
			constructor(public readonly dependency: Dependency) {}
		}
		Reflect.defineMetadata('design:paramtypes', [Dependency], Consumer)

		const events: DiagnosticEvent[] = []
		const diagnosticsEmitter: IDiagnosticsEmitter = {
			emit(event) {
				events.push(event)
			}
		}

		const container = new Container(undefined, diagnosticsEmitter, true)
		container.resolve(Consumer)
		container.resolve(Consumer)

		expect(events.some((event) => event.category === 'di' && event.message.includes('Resolving Consumer'))).toBe(
			true
		)
		expect(
			events.some((event) => event.category === 'di' && event.message.includes('Resolved Consumer from DI cache'))
		).toBe(true)
	})
})
