import type { IMetadataRepository, MetadataComponentType, MetadataComponentTypeMap } from '../interfaces'
import { MetadataRegistry } from './metadata.registry'
import type { Constructor } from '../types'

/**
 * Adapter that exposes MetadataRegistry through the runtime repository contract.
 */
export class StaticMetadataRepository implements IMetadataRepository {
	hasController(controller: Constructor): boolean {
		return MetadataRegistry.hasController(controller)
	}

	getControllerPath(controller: Constructor): string {
		return MetadataRegistry.getControllerPath(controller)
	}

	getControllerOptions(controller: Constructor) {
		return MetadataRegistry.getControllerOptions(controller)
	}

	getRoutes(controller: Constructor) {
		return MetadataRegistry.getRoutes(controller)
	}

	getParameters(controller: Constructor) {
		return MetadataRegistry.getParameters(controller)
	}

	getContextIndices(controller: Constructor) {
		return MetadataRegistry.getContextIndices(controller)
	}

	getModuleOptions(module: Constructor) {
		return MetadataRegistry.getModuleOptions(module)
	}

	getControllerComponents<T extends MetadataComponentType>(
		type: T,
		controller: Constructor
	): MetadataComponentTypeMap[T][] {
		return MetadataRegistry.getController(type, controller) as MetadataComponentTypeMap[T][]
	}

	getHandlerComponents<T extends MetadataComponentType>(type: T, handlerKey: string): MetadataComponentTypeMap[T][] {
		return MetadataRegistry.getHandler(type, handlerKey) as MetadataComponentTypeMap[T][]
	}
}
