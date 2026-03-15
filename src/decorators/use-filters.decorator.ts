import type { FilterType } from '../interfaces'
import { MetadataRegistry } from '../registries'
import type { Constructor } from '../types'

/**
 * Decorator that applies exception filters to a controller class or method
 * @param filters - Array of exception filters to apply
 * @returns A decorator function that can be used at class or method level
 */
export function UseFilters(...filters: FilterType[]) {
	return (target: Constructor | object, propertyKey?: string | symbol): void => {
		if (propertyKey) {
			const controllerClass = target.constructor as Constructor
			const handlerKey = `${controllerClass.name}:${String(propertyKey)}`
			filters.forEach((filter) => MetadataRegistry.registerHandler('filter', handlerKey, filter))
		} else {
			filters.forEach((filter) => MetadataRegistry.registerController('filter', target as Constructor, filter))
		}
	}
}
