import type { Hono } from 'hono'
import type { Application } from '../application'
import type { DiContainer, HonestOptions, IDiagnosticsEmitter, ModuleOptions } from '../interfaces'
import type { Constructor } from '../types'

/**
 * Options for creating a lightweight test module.
 */
export interface TestModuleOptions extends ModuleOptions {
	/**
	 * Optional class name to improve diagnostics in test output.
	 */
	name?: string
}

/**
 * Options for creating a test application instance.
 */
export interface CreateTestApplicationOptions extends TestModuleOptions {
	/**
	 * Existing module class to bootstrap.
	 * If omitted, a module is created from controllers/services/imports.
	 */
	module?: Constructor

	/**
	 * Honest application options passed to Application.create.
	 */
	appOptions?: HonestOptions
}

/**
 * Options for creating a test application around a single controller.
 */
export interface CreateControllerTestApplicationOptions extends Omit<TestModuleOptions, 'controllers'> {
	/**
	 * Controller class to mount in the generated test module.
	 */
	controller: Constructor

	/**
	 * Honest application options passed to Application.create.
	 */
	appOptions?: HonestOptions
}

/**
 * Result object returned by createTestApplication.
 */
export interface TestApplication {
	/**
	 * Honest application instance.
	 */
	app: Application

	/**
	 * Underlying Hono app.
	 */
	hono: Hono

	/**
	 * Convenience request helper for tests.
	 * Relative paths are resolved against http://localhost.
	 */
	request: (input: string | Request, init?: RequestInit) => Promise<Response>
}

/**
 * Override a service token with a pre-built test instance.
 */
export interface ServiceTestOverride<T = unknown> {
	provide: Constructor<T>
	useValue: T
}

/**
 * Options for creating a service-only test container.
 */
export interface CreateServiceTestContainerOptions {
	/**
	 * Optional service overrides registered before any resolve calls.
	 */
	overrides?: ServiceTestOverride[]

	/**
	 * Optional services to resolve immediately so tests can assert warm startup state.
	 */
	preload?: Constructor[]

	/**
	 * Optional diagnostics emitter used when debugDi is enabled.
	 */
	diagnostics?: IDiagnosticsEmitter

	/**
	 * Enable DI diagnostics while resolving services.
	 */
	debugDi?: boolean
}

/**
 * Service-only test harness around the DI container.
 */
export interface TestServiceContainer {
	container: DiContainer
	get<T>(target: Constructor<T>): T
	register<T>(target: Constructor<T>, instance: T): void
	has<T>(target: Constructor<T>): boolean
	clear(): void
}
