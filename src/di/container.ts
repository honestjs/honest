import type { DiContainer } from '../interfaces'
import type { Constructor } from '../types'

/**
 * Dependency Injection container that manages class instances and their dependencies
 */
export class Container implements DiContainer {
	/**
	 * Map of class constructors to their instances
	 */
	private instances = new Map<Constructor, any>()

	/**
	 * Resolves a class instance, creating it if necessary and injecting its dependencies
	 * @param target - The class constructor to resolve
	 * @param resolving - A set of classes currently being resolved, for circular dependency detection
	 * @returns An instance of the target class
	 */
	resolve<T>(target: Constructor<T>, resolving = new Set<Constructor>()): T {
		// Return cached instance if available
		if (this.instances.has(target)) {
			return this.instances.get(target)
		}

		if (resolving.has(target)) {
			throw new Error(
				`Circular dependency detected: ${[...resolving.keys(), target].map((t) => t.name).join(' -> ')}`
			)
		}
		resolving.add(target)

		// Get constructor parameters metadata
		const paramTypes = Reflect.getMetadata('design:paramtypes', target) || []

		// Resolve dependencies recursively
		const dependencies = paramTypes.map((paramType: Constructor) => {
			return this.resolve(paramType, new Set(resolving))
		})

		// Create new instance with dependencies
		const instance = new target(...dependencies)
		this.instances.set(target, instance)

		return instance
	}

	/**
	 * Registers a pre-created instance for a class
	 * @param target - The class constructor to register
	 * @param instance - The instance to register
	 */
	register<T>(target: Constructor<T>, instance: T): void {
		this.instances.set(target, instance)
	}
}
