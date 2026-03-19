import type { ControllerOptions } from './controller-options.interface'
import type { FilterType } from './filter.interface'
import type { GuardType } from './guard.interface'
import type { MiddlewareType } from './middleware.interface'
import type { ModuleOptions } from './module-options.interface'
import type { ParameterMetadata } from './parameter-metadata.interface'
import type { PipeType } from './pipe.interface'
import type { RouteDefinition } from './route-definition.interface'
import type { Constructor } from '../types'

export type MetadataComponentType = 'middleware' | 'guard' | 'pipe' | 'filter'

export interface MetadataComponentTypeMap {
	middleware: MiddlewareType
	guard: GuardType
	pipe: PipeType
	filter: FilterType
}

/**
 * Runtime metadata access contract used by framework managers.
 */
export interface IMetadataRepository {
	hasController(controller: Constructor): boolean
	getControllerPath(controller: Constructor): string
	getControllerOptions(controller: Constructor): ControllerOptions
	getRoutes(controller: Constructor): RouteDefinition[]
	getParameters(controller: Constructor): Map<string | symbol, ParameterMetadata[]>
	getContextIndices(controller: Constructor): Map<string | symbol, number>
	getModuleOptions(module: Constructor): ModuleOptions | undefined
	getControllerComponents<T extends MetadataComponentType>(
		type: T,
		controller: Constructor
	): MetadataComponentTypeMap[T][]
	getHandlerComponents<T extends MetadataComponentType>(type: T, handlerKey: string): MetadataComponentTypeMap[T][]
}
