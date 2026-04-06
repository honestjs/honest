import type { PipeType } from '../interfaces'
import { MetadataRegistry } from '../registries'
import type { Constructor } from '../types'

/**
 * Decorator that applies transformation pipes to a controller class or method
 * Pipes transform input data before it reaches the route handler
 * @param pipes - Array of pipes to apply
 * @returns A decorator function that can be used at class or method level
 */
export function UsePipes(...pipes: PipeType[]) {
	return (target: Constructor | object, propertyKey?: string | symbol): void => {
		if (propertyKey) {
			const controllerClass = target.constructor as Constructor
			pipes.forEach((pipe) => MetadataRegistry.registerHandler('pipe', controllerClass, propertyKey, pipe))
		} else {
			pipes.forEach((pipe) => MetadataRegistry.registerController('pipe', target as Constructor, pipe))
		}
	}
}
