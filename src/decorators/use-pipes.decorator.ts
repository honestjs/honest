import type { PipeType } from '../interfaces'
import { ComponentManager } from '../managers'
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
			// Method decorator - handler-level pipes
			const controllerClass = target.constructor as Constructor
			ComponentManager.registerHandler('pipe', controllerClass, propertyKey, ...pipes)
		} else {
			// Class decorator - controller-level pipes
			ComponentManager.registerController('pipe', target as Constructor, ...pipes)
		}
	}
}
