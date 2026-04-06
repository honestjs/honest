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
 * Immutable metadata repository for a single Application instance.
 * Captures a deep copy of all metadata reachable from a root module at creation time,
 * isolating the application from later mutations to the static MetadataRegistry.
 */
export class MetadataRepository implements IMetadataRepository {
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
	private readonly handlerComponents = new Map<
		MetadataComponentType,
		Map<Constructor, Map<string | symbol, unknown[]>>
	>([
		['middleware', new Map()],
		['guard', new Map()],
		['pipe', new Map()],
		['filter', new Map()]
	])

	static fromRootModule(rootModule: Constructor): MetadataRepository {
		const snapshot = new MetadataRepository()
		snapshot.captureModuleGraph(rootModule)
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

	getHandlerComponents<T extends MetadataComponentType>(
		type: T,
		controller: Constructor,
		handlerName: string | symbol
	): MetadataComponentTypeMap[T][] {
		const typeMap = this.handlerComponents.get(type)!
		const controllerMap = typeMap.get(controller)
		if (!controllerMap) {
			return []
		}
		const components = (controllerMap.get(handlerName) || []) as MetadataComponentTypeMap[T][]
		return [...components]
	}

	private captureModuleGraph(rootModule: Constructor): void {
		const visitedModules = new Set<Constructor>()
		const controllers = new Set<Constructor>()

		const visitModule = (moduleClass: Constructor): void => {
			if (visitedModules.has(moduleClass)) {
				return
			}
			visitedModules.add(moduleClass)

			const moduleOptions = MetadataRegistry.getModuleOptions(moduleClass)
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
			this.captureController(controller)
		}
	}

	private captureController(controller: Constructor): void {
		if (!MetadataRegistry.hasController(controller)) {
			return
		}

		this.controllerPaths.set(controller, MetadataRegistry.getControllerPath(controller) || '')
		this.controllerOptions.set(controller, { ...MetadataRegistry.getControllerOptions(controller) })

		const routes = (MetadataRegistry.getRoutes(controller) || []).map((route) => this.cloneRouteDefinition(route))
		this.routes.set(controller, routes)

		const parameters = MetadataRegistry.getParameters(controller)
		const parameterSnapshot = new Map<string | symbol, ParameterMetadata[]>()
		for (const [handlerName, entries] of parameters.entries()) {
			parameterSnapshot.set(
				handlerName,
				(entries || []).map((entry) => ({ ...entry }))
			)
		}
		this.parameters.set(controller, parameterSnapshot)

		this.contextIndices.set(controller, new Map(MetadataRegistry.getContextIndices(controller) || new Map()))

		for (const type of ['middleware', 'guard', 'pipe', 'filter'] as const) {
			const controllerMap = this.controllerComponents.get(type)!
			controllerMap.set(controller, [...(MetadataRegistry.getController(type, controller) || [])])
		}

		for (const route of routes) {
			for (const type of ['middleware', 'guard', 'pipe', 'filter'] as const) {
				const typeMap = this.handlerComponents.get(type)!
				if (!typeMap.has(controller)) {
					typeMap.set(controller, new Map())
				}
				const controllerHandlers = typeMap.get(controller)!
				controllerHandlers.set(route.handlerName, [
					...MetadataRegistry.getHandler(type, controller, route.handlerName)
				])
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
