import { NoopLogger } from '../diagnostics'
import type { LogEvent, DiContainer, ILogger, IServiceRegistry } from '../interfaces'
import { StaticServiceRegistry } from '../registries'
import type { Constructor } from '../types'

/**
 * Dependency Injection container that manages class instances and their dependencies
 */
export class Container implements DiContainer {
	constructor(
		private readonly serviceRegistry: IServiceRegistry = new StaticServiceRegistry(),
		private readonly logger: ILogger = new NoopLogger(),
		private readonly debugDi = false
	) {}

	/**
	 * Map of class constructors to their instances
	 */
	private instances = new Map<Constructor, any>()

	private emitLog(event: LogEvent): void {
		if (!this.debugDi) {
			return
		}
		this.logger.emit(event)
	}

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
			this.emitLog({
				level: 'debug',
				category: 'di',
				message: `Resolved ${target.name} from DI cache`
			})
			return this.instances.get(target)
		}

		if (resolving.has(target)) {
			const cycle = [...resolving.keys(), target].map((t) => t.name).join(' -> ')
			this.emitLog({
				level: 'error',
				category: 'di',
				message: `Circular dependency detected while resolving ${target.name}`,
				details: { cycle }
			})
			throw new Error(`Circular dependency detected: ${cycle}`)
		}
		resolving.add(target)

		this.emitLog({
			level: 'debug',
			category: 'di',
			message: `Resolving ${target.name}`,
			details: { resolving: [...resolving].map((constructor) => constructor.name) }
		})

		const paramTypes = Reflect.getMetadata('design:paramtypes', target) || []
		if (target.length > 0 && paramTypes.length === 0) {
			if (!this.serviceRegistry.isService(target)) {
				this.emitLog({
					level: 'error',
					category: 'di',
					message: `Cannot resolve ${target.name}: missing @Service() decorator`
				})
				throw new Error(
					`Cannot resolve ${target.name}: it is not decorated with @Service(). Did you forget to add @Service() to the class?`
				)
			}
			this.emitLog({
				level: 'error',
				category: 'di',
				message: `Cannot resolve ${target.name}: missing constructor metadata`
			})
			throw new Error(
				`Cannot resolve dependencies for ${target.name}: constructor metadata is missing. Ensure 'reflect-metadata' is imported and 'emitDecoratorMetadata' is enabled.`
			)
		}

		const dependencies = paramTypes.map((paramType: Constructor, index: number) => {
			if (!paramType || paramType === Object || paramType === Array || paramType === Function) {
				this.emitLog({
					level: 'error',
					category: 'di',
					message: `Cannot resolve dependency at index ${index} of ${target.name}`
				})
				throw new Error(
					`Cannot resolve dependency at index ${index} of ${target.name}. Use concrete class types for constructor dependencies.`
				)
			}
			return this.resolveWithTracking(paramType, new Set(resolving))
		})

		const instance = new target(...dependencies)
		this.instances.set(target, instance)

		this.emitLog({
			level: 'debug',
			category: 'di',
			message: `Created ${target.name} instance`,
			details: { dependencyCount: dependencies.length }
		})

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
