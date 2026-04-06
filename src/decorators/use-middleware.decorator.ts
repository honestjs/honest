import type { MiddlewareType } from '../interfaces'
import { MetadataRegistry } from '../registries'
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
			const controllerClass = target.constructor as Constructor
			middleware.forEach((mw) => MetadataRegistry.registerHandler('middleware', controllerClass, propertyKey, mw))
		} else {
			middleware.forEach((mw) => MetadataRegistry.registerController('middleware', target as Constructor, mw))
		}
	}
}
