import 'reflect-metadata'
import { describe, expect, test } from 'bun:test'
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
})
