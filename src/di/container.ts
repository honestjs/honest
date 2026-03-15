import type { DiContainer } from '../interfaces'
import { MetadataRegistry } from '../registries'
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
	 * @returns An instance of the target class
	 */
	resolve<T>(target: Constructor<T>): T {
		return this.resolveWithTracking(target, new Set<Constructor>())
	}

	/**
	 * Internal recursive resolver with circular dependency tracking
	 */
	private resolveWithTracking<T>(target: Constructor<T>, resolving: Set<Constructor>): T {
		if (this.instances.has(target)) {
			return this.instances.get(target)
		}

		if (resolving.has(target)) {
			throw new Error(
				`Circular dependency detected: ${[...resolving.keys(), target].map((t) => t.name).join(' -> ')}`
			)
		}
		resolving.add(target)

		const paramTypes = Reflect.getMetadata('design:paramtypes', target) || []
		if (target.length > 0 && paramTypes.length === 0) {
			if (!MetadataRegistry.isService(target)) {
				throw new Error(
					`Cannot resolve ${target.name}: it is not decorated with @Service(). Did you forget to add @Service() to the class?`
				)
			}
			throw new Error(
				`Cannot resolve dependencies for ${target.name}: constructor metadata is missing. Ensure 'reflect-metadata' is imported and 'emitDecoratorMetadata' is enabled.`
			)
		}

		const dependencies = paramTypes.map((paramType: Constructor, index: number) => {
			if (!paramType || paramType === Object || paramType === Array || paramType === Function) {
				throw new Error(
					`Cannot resolve dependency at index ${index} of ${target.name}. Use concrete class types for constructor dependencies.`
				)
			}
			return this.resolveWithTracking(paramType, new Set(resolving))
		})

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

	has<T>(target: Constructor<T>): boolean {
		return this.instances.has(target)
	}

	clear(): void {
		this.instances.clear()
	}
}
