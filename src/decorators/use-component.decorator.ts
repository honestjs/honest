import { ComponentManager } from '../managers'
import type { ComponentType, ComponentTypeMap } from '../registries'
import type { Constructor } from '../types'

/**
 * Generic decorator that applies components of a specific type to a controller class or method
 * @template T - The type of component being applied
 * @param type - The component type identifier
 * @param components - Array of components to apply
 * @returns A decorator function that can be used at class or method level
 */
export function UseComponent<T extends ComponentType>(type: T, ...components: ComponentTypeMap[T][]) {
	return (target: Constructor | object, propertyKey?: string | symbol): void => {
		if (propertyKey) {
			// Method decorator - handler-level components
			const controllerClass = target.constructor as Constructor
			ComponentManager.registerHandler(type, controllerClass, propertyKey, ...components)
		} else {
			// Class decorator - controller-level components
			ComponentManager.registerController(type, target as Constructor, ...components)
		}
	}
}
