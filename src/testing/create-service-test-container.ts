import { NoopLogger } from '../loggers'
import { Container } from '../di'
import type { CreateServiceTestContainerOptions, ServiceTestOverride, TestServiceContainer } from './testing.interface'

/**
 * Create a lightweight DI container for service-only tests without HTTP bootstrap.
 */
export function createServiceTestContainer(options: CreateServiceTestContainerOptions = {}): TestServiceContainer {
	const logger = options.logger ?? new NoopLogger()
	const container = new Container(undefined, logger, Boolean(options.debugDi))

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
