import type { Constructor } from '../types'

/**
 * Interface for dependency injection containers
 * Defines the contract that DI containers must implement to work with the Honest framework
 * Handles the creation and management of dependency instances
 */
export interface DiContainer {
	/**
	 * Resolves a dependency from the container
	 * Creates a new instance or returns an existing one based on the container's configuration
	 * @param target - The class constructor to resolve
	 * @returns An instance of the requested class with all dependencies injected
	 * @throws {Error} If the dependency cannot be resolved
	 */
	resolve<T>(target: Constructor<T>): T

	/**
	 * Registers a pre-created instance in the container
	 * Used for singleton instances or mocks in testing
	 * @param target - The class constructor to register the instance for
	 * @param instance - The pre-created instance to use
	 * @throws {Error} If registration fails
	 */
	register<T>(target: Constructor<T>, instance: T): void
}
