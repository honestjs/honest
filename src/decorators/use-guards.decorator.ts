import type { GuardType } from '../interfaces'
import { MetadataRegistry } from '../registries'
import type { Constructor } from '../types'

/**
 * Decorator that applies guards to a controller class or method
 * Guards determine whether a request should be handled by the route handler
 * @param guards - Array of guards to apply
 * @returns A decorator function that can be used at class or method level
 */
export function UseGuards(...guards: GuardType[]) {
	return (target: Constructor | object, propertyKey?: string | symbol): void => {
		if (propertyKey) {
			const controllerClass = target.constructor as Constructor
			guards.forEach((guard) => MetadataRegistry.registerHandler('guard', controllerClass, propertyKey, guard))
		} else {
			guards.forEach((guard) => MetadataRegistry.registerController('guard', target as Constructor, guard))
		}
	}
}
