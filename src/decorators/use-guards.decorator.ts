import type { GuardType } from '../interfaces'
import { ComponentManager } from '../managers'
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
			// Method decorator - handler-level guards
			const controllerClass = target.constructor as Constructor
			ComponentManager.registerHandler('guard', controllerClass, propertyKey, ...guards)
		} else {
			// Class decorator - controller-level guards
			ComponentManager.registerController('guard', target as Constructor, ...guards)
		}
	}
}
