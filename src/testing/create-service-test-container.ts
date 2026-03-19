import { NoopDiagnosticsEmitter } from '../diagnostics'
import { Container } from '../di'
import type { CreateServiceTestContainerOptions, ServiceTestOverride, TestServiceContainer } from './testing.interface'

/**
 * Create a lightweight DI container for service-only tests without HTTP bootstrap.
 */
export function createServiceTestContainer(options: CreateServiceTestContainerOptions = {}): TestServiceContainer {
	const diagnostics = options.diagnostics ?? new NoopDiagnosticsEmitter()
	const container = new Container(undefined, diagnostics, Boolean(options.debugDi))

	for (const override of options.overrides ?? []) {
		const typedOverride = override as ServiceTestOverride
		container.register(typedOverride.provide, typedOverride.useValue)
	}

	for (const service of options.preload ?? []) {
		container.resolve(service)
	}

	return {
		container,
		get(target) {
			return container.resolve(target)
		},
		register(target, instance) {
			container.register(target, instance)
		},
		has(target) {
			return container.has(target)
		},
		clear() {
			container.clear()
		}
	}
}
