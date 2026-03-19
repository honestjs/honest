import type { IServiceRegistry } from '../interfaces'
import { MetadataRegistry } from './metadata.registry'
import type { Constructor } from '../types'

/**
 * Adapter exposing service checks through the DI service registry contract.
 */
export class StaticServiceRegistry implements IServiceRegistry {
	isService(service: Constructor): boolean {
		return MetadataRegistry.isService(service)
	}
}
