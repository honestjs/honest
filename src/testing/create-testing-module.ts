import { Module } from '../decorators'
import type { Constructor } from '../types'
import type { TestModuleOptions } from './testing.interface'

/**
 * Create a runtime module class for tests without boilerplate.
 */
export function createTestingModule(options: TestModuleOptions = {}): Constructor {
	const { controllers, services, imports, name = 'TestModule' } = options
	const dynamicModule = {
		[name]: class {}
	}[name] as Constructor

	Module({ controllers, services, imports })(dynamicModule)
	return dynamicModule
}
