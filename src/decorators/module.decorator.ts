import type { ModuleOptions } from '../interfaces'
import { MetadataRegistry } from '../registries'

/**
 * Decorator that marks a class as a module
 * Modules are used to organize the application structure and dependencies
 * @param options - Configuration options for the module
 * @returns A class decorator function
 */
export function Module(options: ModuleOptions = {}): ClassDecorator {
	return (target: any) => {
		MetadataRegistry.setModuleOptions(target, options)
	}
}
