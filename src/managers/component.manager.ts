import type { Context, Next } from 'hono'
import { createErrorResponse } from '../helpers'
import type {
	ArgumentMetadata,
	DiContainer,
	FilterType,
	GuardType,
	IFilter,
	IGuard,
	IMiddleware,
	IPipe,
	MiddlewareType,
	PipeType
} from '../interfaces'
import { type ComponentType, type ComponentTypeMap, MetadataRegistry } from '../registries'
import type { Constructor } from '../types'

const isObject = (val: unknown): val is Record<PropertyKey, unknown> => val !== null && typeof val === 'object'

/**
 * Manager class for handling all component types in the Honest framework
 * Provides unified management of middleware, guards, pipes, and filters
 * Handles component registration, resolution, and execution at global, controller, and handler levels
 * Works with the dependency injection container to resolve component instances
 */
export class ComponentManager {
	private static container: DiContainer

	/**
	 * Initializes the ComponentManager with a dependency injection container
	 * Must be called before using any other ComponentManager methods
	 * @param container - The dependency injection container to use for resolving components
	 */
	static init(container: DiContainer): void {
		this.container = container
	}

	/**
	 * Configures global components from application options
	 * Global components are applied to all routes in the application
	 * @param options - Application options containing component configurations
	 * @param options.components - Optional component configuration object
	 * @param options.components.middleware - Optional array of global middleware
	 * @param options.components.guards - Optional array of global guards
	 * @param options.components.pipes - Optional array of global pipes
	 * @param options.components.filters - Optional array of global filters
	 */
	static setupGlobalComponents(options: {
		components?: { middleware?: any[]; guards?: any[]; pipes?: any[]; filters?: any[] }
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

	/**
	 * Registers a component at the global level
	 * @param type - The type of component to register
	 * @param components - The component classes or instances to register
	 */
	static registerGlobal<T extends ComponentType>(type: T, ...components: ComponentTypeMap[T][]): void {
		components.forEach((component) => {
			MetadataRegistry.registerGlobal(type, component)
		})
	}

	/**
	 * Registers a component at the controller level
	 * @param type - The type of component to register
	 * @param controller - The controller class to register the component for
	 * @param components - The component classes or instances to register
	 */
	static registerController<T extends ComponentType>(
		type: T,
		controller: Constructor,
		...components: ComponentTypeMap[T][]
	): void {
		components.forEach((component) => {
			MetadataRegistry.registerController(type, controller, component)
		})
	}

	/**
	 * Registers a component at the handler level
	 * @param type - The type of component to register
	 * @param controller - The controller class
	 * @param handlerName - The handler method name
	 * @param components - The component classes or instances to register
	 */
	static registerHandler<T extends ComponentType>(
		type: T,
		controller: Constructor,
		handlerName: string | symbol,
		...components: ComponentTypeMap[T][]
	): void {
		const handlerKey = `${controller.name}:${String(handlerName)}`
		components.forEach((component) => {
			MetadataRegistry.registerHandler(type, handlerKey, component)
		})
	}

	/**
	 * Gets all components of a specific type for a handler
	 * @param type - The type of component to get
	 * @param controller - The controller class
	 * @param handlerName - The handler method name
	 * ..returns An array of component instances
	 */
	static getComponents<T extends ComponentType>(
		type: T,
		controller: Constructor,
		handlerName: string | symbol
	): ComponentTypeMap[T][] {
		const handlerKey = `${controller.name}:${String(handlerName)}`

		// Get handler-level components
		const handlerComponents = MetadataRegistry.getHandler(type, handlerKey)

		// Get controller-level components
		const controllerComponents = MetadataRegistry.getController(type, controller)

		// Get global components
		const globalComponents = Array.from(MetadataRegistry.getGlobal(type))

		// Combine components (global components run first, then controller components, then handler components)
		return [...globalComponents, ...controllerComponents, ...handlerComponents]
	}

	// Middleware-specific methods

	/**
	 * Resolves middleware classes or instances to middleware functions
	 * @param middlewareItems - The middleware classes or instances to resolve
	 * ..returns An array of middleware functions
	 */
	static resolveMiddleware(
		middlewareItems: MiddlewareType[]
	): ((c: Context, next: Next) => Promise<Response | void>)[] {
		return middlewareItems.map((middlewareItem) => {
			// Check if the middleware is already an instance
			if (isObject(middlewareItem) && 'use' in middlewareItem) {
				return (middlewareItem as IMiddleware).use.bind(middlewareItem)
			}

			// Otherwise, resolve the class to an instance
			const middleware = this.container.resolve(middlewareItem as Constructor<IMiddleware>)
			return middleware.use.bind(middleware)
		})
	}

	/**
	 * Gets middleware for a specific handler
	 * @param controller - The controller class
	 * @param handlerName - The handler method name
	 * ..returns An array of middleware functions
	 */
	static getHandlerMiddleware(
		controller: Constructor,
		handlerName: string | symbol
	): ((c: Context, next: Next) => Promise<Response | void>)[] {
		const middlewareItems = this.getComponents('middleware', controller, handlerName)
		return this.resolveMiddleware(middlewareItems as MiddlewareType[])
	}

	/**
	 * Gets global middleware
	 * ..returns An array of middleware functions
	 */
	static getGlobalMiddleware(): ((c: Context, next: Next) => Promise<Response | void>)[] {
		const globalMiddleware = Array.from(MetadataRegistry.getGlobal('middleware'))
		return this.resolveMiddleware(globalMiddleware as MiddlewareType[])
	}

	// Guard-specific methods

	/**
	 * Resolves guard classes or instances to guard instances
	 * @param guardItems - The guard classes or instances to resolve
	 * ..returns An array of guard instances
	 */
	static resolveGuards(guardItems: GuardType[]): IGuard[] {
		return guardItems.map((guardItem) => {
			// Check if the guard is already an instance
			if (isObject(guardItem) && 'canActivate' in guardItem) {
				return guardItem as IGuard
			}

			// Otherwise, resolve the class to an instance
			return this.container.resolve(guardItem as Constructor<IGuard>)
		})
	}

	/**
	 * Gets guards for a specific handler
	 * @param controller - The controller class
	 * @param handlerName - The handler method name
	 * ..returns An array of guard instances
	 */
	static getHandlerGuards(controller: Constructor, handlerName: string | symbol): IGuard[] {
		const guardItems = this.getComponents('guard', controller, handlerName)
		return this.resolveGuards(guardItems as GuardType[])
	}

	// Pipe-specific methods

	/**
	 * Resolves pipe classes or instances to pipe instances
	 * @param pipeItems - The pipe classes or instances to resolve
	 * ..returns An array of pipe instances
	 */
	static resolvePipes(pipeItems: PipeType[]): IPipe[] {
		return pipeItems.map((pipeItem) => {
			// Check if the pipe is already an instance
			if (isObject(pipeItem) && 'transform' in pipeItem) {
				return pipeItem as IPipe
			}

			// Otherwise, resolve the class to an instance
			return this.container.resolve(pipeItem as Constructor<IPipe>)
		})
	}

	/**
	 * Gets pipes for a specific handler
	 * @param controller - The controller class
	 * @param handlerName - The handler method name
	 * ..returns An array of pipe instances
	 */
	static getHandlerPipes(controller: Constructor, handlerName: string | symbol): IPipe[] {
		const pipeItems = this.getComponents('pipe', controller, handlerName)
		return this.resolvePipes(pipeItems as PipeType[])
	}

	/**
	 * Executes a series of pipes on a value
	 * Pipes are executed in sequence, with each pipe's output feeding into the next pipe
	 * @param value - The initial value to transform
	 * @param metadata - Metadata about the parameter being transformed
	 * @param pipes - Array of pipes to execute
	 * @returns The final transformed value after all pipes have executed
	 * @throws {Error} If any pipe transformation fails
	 */
	static async executePipes(value: any, metadata: ArgumentMetadata, pipes: IPipe[]): Promise<any> {
		let transformedValue = value

		for (const pipe of pipes) {
			transformedValue = await pipe.transform(transformedValue, metadata)
		}

		return transformedValue
	}

	// Filter-specific methods

	/**
	 * Handles an exception by passing it through registered exception filters
	 * Filters are executed in sequence until one returns a response
	 * @param exception - The error to handle
	 * @param context - The Hono context object
	 * @returns A Response object if a filter handles the exception, undefined otherwise
	 */
	static async handleException(exception: Error, context: Context): Promise<Response | undefined> {
		// Get controller from context
		const controller = context.get('controllerClass') as Constructor | undefined
		const handlerName = context.get('handlerName') as string | undefined

		// 1. Try handler-level filters first if we have the handler information
		if (controller && handlerName) {
			const handlerFilters = MetadataRegistry.getHandler('filter', `${controller.name}:${handlerName}`)
			if (handlerFilters.length > 0) {
				const response = await this.executeFilters(handlerFilters as FilterType[], exception, context)
				if (response) return response
			}
		}

		// 2. Try controller-specific filters next
		if (controller) {
			const controllerFilters = MetadataRegistry.getController('filter', controller)
			if (controllerFilters.length > 0) {
				const response = await this.executeFilters(controllerFilters as FilterType[], exception, context)
				if (response) return response
			}
		}

		// 3. Try global filters
		const globalFilters = Array.from(MetadataRegistry.getGlobal('filter'))
		if (globalFilters.length > 0) {
			const response = await this.executeFilters(globalFilters as FilterType[], exception, context)
			if (response) return response
		}

		// 4. If no filters handled the exception, create a default response
		console.log('No filter handled the exception, creating default response')

		const { response, status } = createErrorResponse(exception, context)
		return context.json(response, status)
	}

	/**
	 * Executes a list of exception filters
	 * @param filterItems - The exception filter classes or instances to execute
	 * @param exception - The exception that was thrown
	 * @param context - The Hono context object
	 * ..returns The response from the first filter that handles the exception or undefined if no filter handled it
	 */
	private static async executeFilters(
		filterItems: FilterType[],
		exception: Error,
		context: Context
	): Promise<Response | undefined> {
		for (const filterItem of filterItems) {
			let filter: IFilter

			// Check if the filter is already an instance
			if (isObject(filterItem) && 'catch' in filterItem) {
				filter = filterItem as IFilter
			} else {
				// Otherwise, resolve the class to an instance
				filter = this.container.resolve(filterItem as Constructor<IFilter>)
			}

			try {
				const result = await filter.catch(exception, context)
				if (result !== undefined) {
					return result as Response
				}
			} catch (error) {
				console.error('Error in exception filter:', error)
			}
		}
		return undefined
	}

	/**
	 * Registers a module and its dependencies with the container
	 * @param moduleClass - The module class to register
	 * @param container - The dependency injection container
	 * @returns An array of controller classes registered from this module
	 */
	static async registerModule(moduleClass: Constructor, container: DiContainer): Promise<Constructor[]> {
		const moduleOptions = MetadataRegistry.getModuleOptions(moduleClass)

		if (!moduleOptions) {
			throw new Error(`Module ${moduleClass.name} is not properly decorated with @Module()`)
		}

		const controllers: Constructor[] = []

		// Register imported modules recursively
		if (moduleOptions.imports && moduleOptions.imports.length > 0) {
			for (const importedModule of moduleOptions.imports) {
				const importedControllers = await this.registerModule(importedModule, container)
				controllers.push(...importedControllers)
			}
		}

		// Register services
		if (moduleOptions.services && moduleOptions.services.length > 0) {
			for (const serviceClass of moduleOptions.services) {
				container.resolve(serviceClass)
			}
		}

		// Add controllers from this module
		if (moduleOptions.controllers && moduleOptions.controllers.length > 0) {
			controllers.push(...moduleOptions.controllers)
		}

		return controllers
	}
}
