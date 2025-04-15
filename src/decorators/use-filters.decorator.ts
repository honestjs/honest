import type { FilterType } from '../interfaces'
import { ComponentManager } from '../managers'
import type { Constructor } from '../types'

/**
 * Decorator that applies exception filters to a controller class or method
 * @param filters - Array of exception filters to apply
 * @returns A decorator function that can be used at class or method level
 */
export function UseFilters(...filters: FilterType[]) {
	return (target: Constructor | object, propertyKey?: string | symbol): void => {
		if (propertyKey) {
			// Method decorator - handler-level exception filters
			const controllerClass = target.constructor as Constructor
			ComponentManager.registerHandler('filter', controllerClass, propertyKey, ...filters)
		} else {
			// Class decorator - controller-level exception filters
			ComponentManager.registerController('filter', target as Constructor, ...filters)
		}
	}
}
