import { MetadataRegistry } from '../registries'

/**
 * Decorator that marks a class as a service
 * Services are singleton classes that can be injected as dependencies
 * @returns A class decorator function
 */
export function Service(): ClassDecorator {
	return (target: any) => {
		MetadataRegistry.addService(target)
	}
}
