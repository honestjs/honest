import type { MiddlewareType } from '../interfaces'
import { ComponentManager } from '../managers'
import type { Constructor } from '../types'

/**
 * Decorator that applies middleware to a controller class or method
 * Middleware functions run before the route handler and can modify the request/response
 * @param middleware - Array of middleware functions to apply
 * @returns A decorator function that can be used at class or method level
 */
export function UseMiddleware(...middleware: MiddlewareType[]) {
	return (target: Constructor | object, propertyKey?: string | symbol): void => {
		if (propertyKey) {
			// Method decorator - handler-level middleware
			const controllerClass = target.constructor as Constructor
			ComponentManager.registerHandler('middleware', controllerClass, propertyKey, ...middleware)
		} else {
			// Class decorator - controller-level middleware
			ComponentManager.registerController('middleware', target as Constructor, ...middleware)
		}
	}
}
