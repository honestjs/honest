import type { Context, Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { VERSION_NEUTRAL } from '../constants'
import type { DiContainer } from '../interfaces'
import { ComponentManager } from '../managers'
import { MetadataRegistry, RouteRegistry } from '../registries'
import type { Constructor } from '../types'
import { isNil, isString, normalizePath } from '../utils'

/**
 * Manager class for handling route registration in the Honest framework
 * Responsible for:
 * - Registering controller routes with the Hono application
 * - Managing route versioning and prefixing
 * - Applying middleware and guards to routes
 * - Handling parameter transformation and validation
 *
 * Versioning features:
 * - Global version setting can be overridden at controller or method level
 * - Controllers can opt out of versioning by setting version to null
 * - Routes can use VERSION_NEUTRAL to be accessible with and without version prefix
 * - Routes can specify an array of versions to support multiple versions
 *
 * Path handling:
 * - Global prefix can be overridden at controller level
 * - Paths are automatically normalized
 * - Final path structure: prefix/version/controller-path/method-path
 */
export class RouteManager {
	private hono: Hono
	private container: DiContainer
	private globalPrefix?: string
	private globalVersion?: number | typeof VERSION_NEUTRAL | number[]

	/**
	 * Creates a new RouteManager instance
	 * @param hono - The Hono application instance for route registration
	 * @param container - The dependency injection container for resolving controllers and dependencies
	 * @param options - Configuration options for the route manager
	 * @param options.prefix - Optional global prefix for all routes
	 * @param options.version - Optional global version or version array for all routes
	 */
	constructor(
		hono: Hono,
		container: DiContainer,
		options: { prefix?: string; version?: number | typeof VERSION_NEUTRAL | number[] } = {}
	) {
		this.hono = hono
		this.container = container
		// Normalize the prefix if it's a string
		this.globalPrefix = options.prefix !== undefined ? this.normalizePath(options.prefix) : undefined
		this.globalVersion = options.version

		// Apply global middleware
		this.applyGlobalMiddleware()
	}

	/**
	 * Applies global middleware to the application
	 */
	private applyGlobalMiddleware(): void {
		// Get global middleware
		const globalMiddleware = ComponentManager.getGlobalMiddleware()

		// Apply global middleware to the application
		for (const middleware of globalMiddleware) {
			this.hono.use('*', middleware)
		}
	}

	/**
	 * Normalizes a path segment for route registration
	 * @param path - The path segment to normalize
	 * @returns The normalized path segment
	 */
	private normalizePath(path: unknown): string {
		if (isString(path)) {
			return normalizePath(path)
		}
		return path ? `/${path}` : ''
	}

	/**
	 * Registers a wrapper handler with middleware for a route
	 * @param method - HTTP method
	 * @param path - Full path for the route
	 * @param handlerMiddleware - Middleware for the handler
	 * @param wrapperHandler - The wrapper handler function
	 */
	private registerRouteHandler(
		method: string,
		path: string,
		handlerMiddleware: any[],
		wrapperHandler: (c: Context) => Promise<any>
	): void {
		if (handlerMiddleware.length > 0) {
			// Register the route with middleware
			this.hono.on(method.toUpperCase(), path, ...handlerMiddleware, wrapperHandler)
		} else {
			// Register the route without middleware
			this.hono.on(method.toUpperCase(), path, wrapperHandler)
		}
	}

	/**
	 * Builds a route path with the correct order: prefix, version, controller path, method path
	 * @param prefix - Global or controller-specific prefix
	 * @param version - Version string (e.g., '/v1') or empty string if no version
	 * @param controllerPath - Controller path
	 * @param methodPath - Method-specific path
	 * @returns Properly formatted full path
	 */
	private buildRoutePath(prefix: string, version: string, controllerPath: string, methodPath: string): string {
		// Combine segments in the correct order
		return normalizePath(`${prefix}${version}${controllerPath}${methodPath}`)
	}

	/**
	 * Formats a version number or VERSION_NEUTRAL into a path segment
	 * @param version - Version number or VERSION_NEUTRAL
	 * @returns Formatted version string (e.g., '/v1') or empty string if null
	 */
	private formatVersionSegment(version: number | typeof VERSION_NEUTRAL | null): string {
		if (isNil(version)) {
			return ''
		}
		return version === VERSION_NEUTRAL ? '' : `/v${String(version)}`
	}

	/**
	 * Registers a controller and all its routes with the application
	 * Handles versioning, prefixing, and middleware application
	 *
	 * @param controllerClass - The controller class to register
	 * @throws {Error} If controller registration fails or if required dependencies cannot be resolved
	 *
	 * Route registration process:
	 * 1. Resolves controller instance and metadata
	 * 2. Processes controller-level options (prefix, version)
	 * 3. Registers each route with appropriate:
	 *    - Path construction (prefix/version/controller-path/method-path)
	 *    - Middleware application
	 *    - Parameter processing
	 *    - Guard validation
	 */
	async registerController(controllerClass: Constructor): Promise<void> {
		const controllerPath = MetadataRegistry.getControllerPath(controllerClass) || ''
		const controllerOptions = MetadataRegistry.getControllerOptions(controllerClass) || {}
		const routes = MetadataRegistry.getRoutes(controllerClass) || []
		const parameterMetadata = MetadataRegistry.getParameters(controllerClass) || new Map()
		const contextIndices = MetadataRegistry.getContextIndices(controllerClass) || new Map()

		// Resolve controller instance with dependencies
		const controllerInstance = this.container.resolve(controllerClass)

		// Use controller-specific prefix if provided, otherwise use global one
		const effectivePrefix = !isNil(controllerOptions.prefix) ? controllerOptions.prefix : this.globalPrefix

		// Normalize the prefix
		const prefixSegment = !isNil(effectivePrefix) ? this.normalizePath(effectivePrefix) : ''

		// Normalize the controller path
		const controllerSegment = this.normalizePath(controllerPath)

		// Allow opting out of versioning by setting version to null
		const effectiveControllerVersion =
			controllerOptions.version !== undefined ? controllerOptions.version : this.globalVersion

		// Register routes
		for (const route of routes) {
			const { path, method, handlerName, version: routeVersion } = route

			// Check for method-level version setting which overrides controller and global versions
			const effectiveVersion = routeVersion !== undefined ? routeVersion : effectiveControllerVersion

			// Normalize the method path
			const methodSegment = this.normalizePath(path)

			// Skip version processing if version is explicitly null
			if (isNil(effectiveVersion)) {
				// Register route without version
				this.registerRoute(
					controllerInstance,
					route,
					parameterMetadata,
					contextIndices,
					controllerClass,
					prefixSegment,
					'',
					controllerSegment,
					methodSegment,
					method
				)
				continue
			}

			// Check if version is neutral (should register both with and without version)
			if (effectiveVersion === VERSION_NEUTRAL) {
				// Register unversioned route
				this.registerRoute(
					controllerInstance,
					route,
					parameterMetadata,
					contextIndices,
					controllerClass,
					prefixSegment,
					'',
					controllerSegment,
					methodSegment,
					method
				)

				this.registerRoute(
					controllerInstance,
					route,
					parameterMetadata,
					contextIndices,
					controllerClass,
					prefixSegment,
					'/:version{v[0-9]+}',
					controllerSegment,
					methodSegment,
					method
				)
				continue
			}

			// Check if version is an array (register route at each version)
			if (Array.isArray(effectiveVersion)) {
				// Register route at each version in the array
				for (const version of effectiveVersion) {
					const versionSegment = this.formatVersionSegment(version)
					this.registerRoute(
						controllerInstance,
						route,
						parameterMetadata,
						contextIndices,
						controllerClass,
						prefixSegment,
						versionSegment,
						controllerSegment,
						methodSegment,
						method
					)
				}
				continue
			}

			// Register versioned route (we get here only for numeric versions)
			const versionSegment = this.formatVersionSegment(effectiveVersion)
			this.registerRoute(
				controllerInstance,
				route,
				parameterMetadata,
				contextIndices,
				controllerClass,
				prefixSegment,
				versionSegment,
				controllerSegment,
				methodSegment,
				method
			)
		}
	}

	/**
	 * Registers a specific route with the application
	 * Handles middleware setup, parameter processing, and response handling
	 *
	 * @param controllerInstance - Instance of the controller containing the route handler
	 * @param route - Route metadata including path and HTTP method
	 * @param parameterMetadata - Metadata for parameter processing
	 * @param contextIndices - Map of context parameter indices
	 * @param controllerClass - The controller class
	 * @param prefix - Route prefix
	 * @param versionSegment - Version segment of the path
	 * @param controllerSegment - Controller path segment
	 * @param methodSegment - Method-specific path segment
	 * @param method - HTTP method for the route
	 *
	 * @throws {Error} If route registration fails
	 */
	private registerRoute(
		controllerInstance: any,
		route: any,
		parameterMetadata: Map<string | symbol, any[]>,
		contextIndices: Map<string | symbol, number>,
		controllerClass: Constructor,
		prefix: string,
		versionSegment: string,
		controllerSegment: string,
		methodSegment: string,
		method: string
	): void {
		const { handlerName } = route

		// Build the full path in the correct order: prefix, version, controller, method
		const fullPath = this.buildRoutePath(prefix, versionSegment, controllerSegment, methodSegment)

		const handler = controllerInstance[handlerName].bind(controllerInstance)

		// Get parameter metadata for this handler
		const handlerParams = parameterMetadata.get(handlerName) || []
		const contextIndex = contextIndices.get(handlerName)

		// Get handler middleware
		const handlerMiddleware = ComponentManager.getHandlerMiddleware(controllerClass, handlerName)

		// Get handler pipes
		const handlerPipes = ComponentManager.getHandlerPipes(controllerClass, handlerName)

		// Register route in RouteRegistry
		RouteRegistry.registerRoute({
			controller: controllerClass.name,
			handler: handlerName,
			method,
			prefix,
			version: versionSegment,
			route: controllerSegment,
			path: methodSegment,
			fullPath,
			parameters: handlerParams
		})

		// Create wrapper handler
		const wrapperHandler = async (c: Context) => {
			try {
				// Store controller class and handler name in context for exception filters
				c.set('controllerClass', controllerClass)
				c.set('handlerName', String(handlerName))

				// Get handler guards
				const guards = ComponentManager.getHandlerGuards(controllerClass, handlerName)

				// Check guards
				for (const guard of guards) {
					const canActivate = await guard.canActivate(c)
					if (!canActivate) {
						throw new HTTPException(403, { message: 'Forbidden' })
					}
				}

				// Prepare arguments based on parameter decorators
				const args = new Array(handler.length)

				for (const param of handlerParams) {
					// Get the raw value from the parameter decorator
					const rawValue = param.factory(param.data, c)

					// Execute pipes on the value
					const transformedValue = await ComponentManager.executePipes(
						rawValue,
						{
							type: param.type,
							metatype: param.metatype,
							data: param.data
						},
						handlerPipes
					)

					args[param.index] = transformedValue
				}

				// Call the original handler with prepared arguments
				const result = await handler(...args)

				// If a context index is present, it means the handler might have used the context directly
				// In this case, we don't do any additional serialization
				if (contextIndex !== undefined) {
					return result
				}

				// Automatic serialization
				if (isNil(result)) {
					return c.json(null)
				}

				// Check the type of result for serialization
				if (isString(result)) {
					return c.text(result)
				}

				// Default to JSON for objects and other types
				return c.json(result)
			} catch (error) {
				// Handle exception with filters
				return ComponentManager.handleException(error as Error, c)
			}
		}

		// Register the route with the application
		this.registerRouteHandler(method, fullPath, handlerMiddleware, wrapperHandler)
	}
}
