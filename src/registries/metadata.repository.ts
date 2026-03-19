import type {
	ControllerOptions,
	IMetadataRepository,
	MetadataComponentType,
	MetadataComponentTypeMap,
	ModuleOptions,
	ParameterMetadata,
	RouteDefinition
} from '../interfaces'
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

/**
 * Immutable metadata repository snapshot for a single Application instance.
 */
export class SnapshotMetadataRepository implements IMetadataRepository {
	private readonly controllerPaths = new Map<Constructor, string>()
	private readonly controllerOptions = new Map<Constructor, ControllerOptions>()
	private readonly routes = new Map<Constructor, RouteDefinition[]>()
	private readonly parameters = new Map<Constructor, Map<string | symbol, ParameterMetadata[]>>()
	private readonly contextIndices = new Map<Constructor, Map<string | symbol, number>>()
	private readonly modules = new Map<Constructor, ModuleOptions>()
	private readonly controllerComponents = new Map<MetadataComponentType, Map<Constructor, unknown[]>>([
		['middleware', new Map<Constructor, unknown[]>()],
		['guard', new Map<Constructor, unknown[]>()],
		['pipe', new Map<Constructor, unknown[]>()],
		['filter', new Map<Constructor, unknown[]>()]
	])
	private readonly handlerComponents = new Map<MetadataComponentType, Map<string, unknown[]>>([
		['middleware', new Map<string, unknown[]>()],
		['guard', new Map<string, unknown[]>()],
		['pipe', new Map<string, unknown[]>()],
		['filter', new Map<string, unknown[]>()]
	])

	static fromRootModule(
		rootModule: Constructor,
		source: IMetadataRepository = new StaticMetadataRepository()
	): SnapshotMetadataRepository {
		const snapshot = new SnapshotMetadataRepository()
		snapshot.captureModuleGraph(rootModule, source)
		return snapshot
	}

	hasController(controller: Constructor): boolean {
		return this.controllerPaths.has(controller)
	}

	getControllerPath(controller: Constructor): string {
		return this.controllerPaths.get(controller) || ''
	}

	getControllerOptions(controller: Constructor): ControllerOptions {
		const options = this.controllerOptions.get(controller)
		return options ? { ...options } : {}
	}

	getRoutes(controller: Constructor): RouteDefinition[] {
		return (this.routes.get(controller) || []).map((route) => this.cloneRouteDefinition(route))
	}

	getParameters(controller: Constructor): Map<string | symbol, ParameterMetadata[]> {
		const parameters = this.parameters.get(controller)
		if (!parameters) {
			return new Map()
		}

		const cloned = new Map<string | symbol, ParameterMetadata[]>()
		for (const [handlerName, entries] of parameters.entries()) {
			cloned.set(
				handlerName,
				entries.map((entry) => ({ ...entry }))
			)
		}

		return cloned
	}

	getContextIndices(controller: Constructor): Map<string | symbol, number> {
		return new Map(this.contextIndices.get(controller) || new Map())
	}

	getModuleOptions(module: Constructor): ModuleOptions | undefined {
		const options = this.modules.get(module)
		if (!options) {
			return undefined
		}

		return {
			controllers: options.controllers ? [...options.controllers] : undefined,
			services: options.services ? [...options.services] : undefined,
			imports: options.imports ? [...options.imports] : undefined
		}
	}

	getControllerComponents<T extends MetadataComponentType>(
		type: T,
		controller: Constructor
	): MetadataComponentTypeMap[T][] {
		const map = this.controllerComponents.get(type)!
		const components = (map.get(controller) || []) as MetadataComponentTypeMap[T][]
		return [...components]
	}

	getHandlerComponents<T extends MetadataComponentType>(type: T, handlerKey: string): MetadataComponentTypeMap[T][] {
		const map = this.handlerComponents.get(type)!
		const components = (map.get(handlerKey) || []) as MetadataComponentTypeMap[T][]
		return [...components]
	}

	private captureModuleGraph(rootModule: Constructor, source: IMetadataRepository): void {
		const visitedModules = new Set<Constructor>()
		const controllers = new Set<Constructor>()

		const visitModule = (moduleClass: Constructor): void => {
			if (visitedModules.has(moduleClass)) {
				return
			}
			visitedModules.add(moduleClass)

			const moduleOptions = source.getModuleOptions(moduleClass)
			if (!moduleOptions) {
				return
			}

			const moduleSnapshot: ModuleOptions = {
				controllers: moduleOptions.controllers ? [...moduleOptions.controllers] : undefined,
				services: moduleOptions.services ? [...moduleOptions.services] : undefined,
				imports: moduleOptions.imports ? [...moduleOptions.imports] : undefined
			}
			this.modules.set(moduleClass, moduleSnapshot)

			for (const controller of moduleSnapshot.controllers || []) {
				controllers.add(controller)
			}

			for (const importedModule of moduleSnapshot.imports || []) {
				visitModule(importedModule)
			}
		}

		visitModule(rootModule)

		for (const controller of controllers) {
			this.captureController(controller, source)
		}
	}

	private captureController(controller: Constructor, source: IMetadataRepository): void {
		if (!source.hasController(controller)) {
			return
		}

		this.controllerPaths.set(controller, source.getControllerPath(controller) || '')
		this.controllerOptions.set(controller, { ...source.getControllerOptions(controller) })

		const routes = (source.getRoutes(controller) || []).map((route) => this.cloneRouteDefinition(route))
		this.routes.set(controller, routes)

		const parameters = source.getParameters(controller)
		const parameterSnapshot = new Map<string | symbol, ParameterMetadata[]>()
		for (const [handlerName, entries] of parameters.entries()) {
			parameterSnapshot.set(
				handlerName,
				(entries || []).map((entry) => ({ ...entry }))
			)
		}
		this.parameters.set(controller, parameterSnapshot)

		this.contextIndices.set(controller, new Map(source.getContextIndices(controller) || new Map()))

		for (const type of ['middleware', 'guard', 'pipe', 'filter'] as const) {
			const controllerMap = this.controllerComponents.get(type)!
			controllerMap.set(controller, [...(source.getControllerComponents(type, controller) || [])])
		}

		for (const route of routes) {
			const handlerKey = `${controller.name}:${String(route.handlerName)}`
			for (const type of ['middleware', 'guard', 'pipe', 'filter'] as const) {
				const handlerMap = this.handlerComponents.get(type)!
				handlerMap.set(handlerKey, [...(source.getHandlerComponents(type, handlerKey) || [])])
			}
		}
	}

	private cloneRouteDefinition(route: RouteDefinition): RouteDefinition {
		return {
			...route,
			version: Array.isArray(route.version) ? [...route.version] : route.version
		}
	}
}
