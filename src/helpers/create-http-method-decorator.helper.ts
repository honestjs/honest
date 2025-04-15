import type { HttpMethodOptions } from '../interfaces'
import { MetadataRegistry } from '../registries'

/**
 * Creates a decorator factory for HTTP method handlers
 * @param method - The HTTP method type (GET, POST, PUT, etc.)
 * @returns A method decorator factory that accepts a path and options
 * @example
 * ```ts
 * const Get = createHttpMethodDecorator(HttpMethod.GET);
 *
 * class Controller {
 *   @Get('/users')
 *   getUsers() { }
 * }
 * ```
 */
export function createHttpMethodDecorator(method: string) {
	return (path = '', options: HttpMethodOptions = {}): MethodDecorator => {
		return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
			const controllerClass = target.constructor

			// Add route definition
			MetadataRegistry.addRoute(controllerClass, {
				path,
				method,
				handlerName: propertyKey,
				parameterMetadata: [],
				version: options.version
			})
		}
	}
}
