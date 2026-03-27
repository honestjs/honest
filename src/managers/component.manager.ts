import type { Context, Next } from 'hono'
import { HONEST_PIPELINE_CONTROLLER_KEY, HONEST_PIPELINE_HANDLER_KEY } from '../constants'
import { createErrorResponse } from '../helpers'
import type {
	ArgumentMetadata,
	DiContainer,
	FilterType,
	GuardType,
	ILogger,
	IMetadataRepository,
	IFilter,
	IGuard,
	IMiddleware,
	IPipe,
	MiddlewareType,
	PipeType
} from '../interfaces'
import { NoopLogger } from '../diagnostics'
import { type ComponentType, type ComponentTypeMap } from '../registries'
import { StaticMetadataRepository } from '../registries'
import type { Constructor } from '../types'
import { isObject } from '../utils'

type ComponentInstance = MiddlewareType | GuardType | PipeType | FilterType

/**
 * Manager class for handling all component types in the Honest framework.
 *
 * Each Application instance owns a ComponentManager, which holds per-app
 * global components and a reference to the DI container. Controller-level
 * and handler-level components remain in MetadataRegistry (static, set at
 * class-definition time by decorators).
 */
export class ComponentManager {
	private readonly globalComponents = new Map<ComponentType, Set<ComponentInstance>>([
		['middleware', new Set<MiddlewareType>()],
		['guard', new Set<GuardType>()],
		['pipe', new Set<PipeType>()],
		['filter', new Set<FilterType>()]
	])

	constructor(
		private readonly container: DiContainer,
		private readonly metadataRepository: IMetadataRepository = new StaticMetadataRepository(),
		private readonly logger: ILogger = new NoopLogger()
	) {}

	/**
	 * Configures global components from application options.
	 */
	setupGlobalComponents(options: {
		components?: {
			middleware?: MiddlewareType[]
			guards?: GuardType[]
			pipes?: PipeType[]
			filters?: FilterType[]
		}
	}): void {
		const components = options.components || {}

		if (components.middleware) {
			this.registerGlobal('middleware', ...components.middleware)
		}

		if (components.guards) {
			this.registerGlobal('guard', ...components.guards)
		}

		if (components.pipes) {
			this.registerGlobal('pipe', ...components.pipes)
		}

		if (components.filters) {
			this.registerGlobal('filter', ...components.filters)
		}
	}

	registerGlobal<T extends ComponentType>(type: T, ...components: ComponentTypeMap[T][]): void {
		components.forEach((component) => {
			this.globalComponents.get(type)!.add(component as unknown as ComponentInstance)
		})
	}

	getGlobal<T extends ComponentType>(type: T): Set<ComponentTypeMap[T]> {
		return this.globalComponents.get(type) as unknown as Set<ComponentTypeMap[T]>
	}

	/**
	 * Gets all components of a specific type for a handler.
	 * Merges: instance global → static controller → static handler.
	 */
	getComponents<T extends ComponentType>(
		type: T,
		controller: Constructor,
		handlerName: string | symbol
	): ComponentTypeMap[T][] {
		const handlerKey = `${controller.name}:${String(handlerName)}`

		const handlerComponents = this.metadataRepository.getHandlerComponents(type, handlerKey)
		const controllerComponents = this.metadataRepository.getControllerComponents(type, controller)
		const globalComponents = Array.from(this.globalComponents.get(type) || [])

		return [...globalComponents, ...controllerComponents, ...handlerComponents] as ComponentTypeMap[T][]
	}

	// -- Middleware --

	resolveMiddleware(middlewareItems: MiddlewareType[]): ((c: Context, next: Next) => Promise<Response | void>)[] {
		return middlewareItems.map((middlewareItem) => {
			if (isObject(middlewareItem) && 'use' in middlewareItem) {
				return (middlewareItem as IMiddleware).use.bind(middlewareItem)
			}

			const middleware = this.container.resolve(middlewareItem as Constructor<IMiddleware>)
			return middleware.use.bind(middleware)
		})
	}

	getHandlerMiddleware(
		controller: Constructor,
		handlerName: string | symbol
	): ((c: Context, next: Next) => Promise<Response | void>)[] {
		const middlewareItems = this.getComponents('middleware', controller, handlerName)
		return this.resolveMiddleware(middlewareItems as MiddlewareType[])
	}

	getGlobalMiddleware(): ((c: Context, next: Next) => Promise<Response | void>)[] {
		const globalMiddleware = Array.from(this.globalComponents.get('middleware') || [])
		return this.resolveMiddleware(globalMiddleware as MiddlewareType[])
	}

	// -- Guards --

	resolveGuards(guardItems: GuardType[]): IGuard[] {
		return guardItems.map((guardItem) => {
			if (isObject(guardItem) && 'canActivate' in guardItem) {
				return guardItem as IGuard
			}

			return this.container.resolve(guardItem as Constructor<IGuard>)
		})
	}

	getHandlerGuards(controller: Constructor, handlerName: string | symbol): IGuard[] {
		const guardItems = this.getComponents('guard', controller, handlerName)
		return this.resolveGuards(guardItems as GuardType[])
	}

	// -- Pipes --

	resolvePipes(pipeItems: PipeType[]): IPipe[] {
		return pipeItems.map((pipeItem) => {
			if (isObject(pipeItem) && 'transform' in pipeItem) {
				return pipeItem as IPipe
			}

			return this.container.resolve(pipeItem as Constructor<IPipe>)
		})
	}

	getHandlerPipes(controller: Constructor, handlerName: string | symbol): IPipe[] {
		const pipeItems = this.getComponents('pipe', controller, handlerName)
		return this.resolvePipes(pipeItems as PipeType[])
	}

	async executePipes(value: unknown, metadata: ArgumentMetadata, pipes: ReadonlyArray<IPipe>): Promise<unknown> {
		let transformedValue = value

		for (const pipe of pipes) {
			transformedValue = await pipe.transform(transformedValue, metadata)
		}

		return transformedValue
	}

	// -- Filters --

	async handleException(exception: Error, context: Context): Promise<Response | undefined> {
		const controller = context.get(HONEST_PIPELINE_CONTROLLER_KEY) as Constructor | undefined
		const handlerName = context.get(HONEST_PIPELINE_HANDLER_KEY) as string | undefined

		if (controller && handlerName) {
			const handlerFilters = this.metadataRepository.getHandlerComponents(
				'filter',
				`${controller.name}:${handlerName}`
			)
			if (handlerFilters.length > 0) {
				const response = await this.executeFilters(handlerFilters as FilterType[], exception, context)
				if (response) return response
			}
		}

		if (controller) {
			const controllerFilters = this.metadataRepository.getControllerComponents('filter', controller)
			if (controllerFilters.length > 0) {
				const response = await this.executeFilters(controllerFilters as FilterType[], exception, context)
				if (response) return response
			}
		}

		const globalFilters = Array.from(this.globalComponents.get('filter') || [])
		if (globalFilters.length > 0) {
			const response = await this.executeFilters(globalFilters as FilterType[], exception, context)
			if (response) return response
		}

		const { response, status } = createErrorResponse(exception, context)
		return context.json(response, status)
	}

	private async executeFilters(
		filterItems: FilterType[],
		exception: Error,
		context: Context
	): Promise<Response | undefined> {
		for (const filterItem of filterItems) {
			let filter: IFilter

			if (isObject(filterItem) && 'catch' in filterItem) {
				filter = filterItem as IFilter
			} else {
				filter = this.container.resolve(filterItem as Constructor<IFilter>)
			}

			try {
				const result = await filter.catch(exception, context)
				if (result !== undefined) {
					return result as Response
				}
			} catch (filterError) {
				const filterName = filter.constructor?.name || 'UnknownFilter'
				this.logger.emit({
					level: 'error',
					category: 'errors',
					message: `Error in exception filter ${filterName}`,
					details: {
						error: filterError instanceof Error ? filterError.message : String(filterError)
					}
				})

				const { response, status } = createErrorResponse(filterError as Error, context)
				return context.json(response, status)
			}
		}
		return undefined
	}

	// -- Module registration --

	async registerModule(moduleClass: Constructor, registered = new Set<Constructor>()): Promise<Constructor[]> {
		if (registered.has(moduleClass)) {
			return []
		}
		registered.add(moduleClass)

		const moduleOptions = this.metadataRepository.getModuleOptions(moduleClass)

		if (!moduleOptions) {
			this.logger.emit({
				level: 'error',
				category: 'startup',
				message: `Module ${moduleClass.name} is not properly decorated with @Module()`
			})
			throw new Error(`Module ${moduleClass.name} is not properly decorated with @Module()`)
		}

		const controllers: Constructor[] = []

		if (moduleOptions.imports && moduleOptions.imports.length > 0) {
			for (const importedModule of moduleOptions.imports) {
				const importedControllers = await this.registerModule(importedModule, registered)
				controllers.push(...importedControllers)
			}
		}

		if (moduleOptions.services && moduleOptions.services.length > 0) {
			for (const serviceClass of moduleOptions.services) {
				this.container.resolve(serviceClass)
			}
		}

		if (moduleOptions.controllers && moduleOptions.controllers.length > 0) {
			controllers.push(...moduleOptions.controllers)
		}

		return controllers
	}
}
