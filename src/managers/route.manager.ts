import type { Context, Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { HONEST_PIPELINE_CONTROLLER_KEY, HONEST_PIPELINE_HANDLER_KEY, VERSION_NEUTRAL } from '../constants'
import type { DiContainer, IMetadataRepository, ParameterMetadata, RouteDefinition } from '../interfaces'
import { ComponentManager } from './component.manager'
import { ParameterResolver } from './parameter.resolver'
import { StaticMetadataRepository } from '../registries'
import { RouteRegistry } from '../registries/route.registry'
import type { Constructor } from '../types'
import { isNil, isString, normalizePath } from '../utils'

/**
 * Manager class for handling route registration in the Honest framework.
 *
 * Receives all per-app dependencies (Hono, Container, RouteRegistry,
 * ComponentManager) via constructor — no static state.
 */
export class RouteManager {
	private hono: Hono
	private container: DiContainer
	private routeRegistry: RouteRegistry
	private componentManager: ComponentManager
	private parameterResolver: ParameterResolver
	private metadataRepository: IMetadataRepository
	private globalPrefix?: string
	private globalVersion?: number | typeof VERSION_NEUTRAL | number[]

	constructor(
		hono: Hono,
		container: DiContainer,
		routeRegistry: RouteRegistry,
		componentManager: ComponentManager,
		metadataRepository: IMetadataRepository = new StaticMetadataRepository(),
		options: { prefix?: string; version?: number | typeof VERSION_NEUTRAL | number[] } = {}
	) {
		this.hono = hono
		this.container = container
		this.routeRegistry = routeRegistry
		this.componentManager = componentManager
		this.parameterResolver = new ParameterResolver(this.componentManager)
		this.metadataRepository = metadataRepository
		this.globalPrefix = options.prefix !== undefined ? this.normalizePath(options.prefix) : undefined
		this.globalVersion = options.version

		this.applyGlobalMiddleware()
	}

	private applyGlobalMiddleware(): void {
		const globalMiddleware = this.componentManager.getGlobalMiddleware()

		for (const middleware of globalMiddleware) {
			this.hono.use('*', middleware)
		}
	}

	private normalizePath(path: string): string {
		if (!isString(path)) {
			throw new Error(
				`Invalid path: expected a string but received ${typeof path}. Check your @Controller() and route decorator arguments.`
			)
		}
		return normalizePath(path)
	}

	private registerRouteHandler(
		method: string,
		path: string,
		handlerMiddleware: any[],
		wrapperHandler: (c: Context) => Promise<any>
	): void {
		if (handlerMiddleware.length > 0) {
			this.hono.on(method.toUpperCase(), [path], ...handlerMiddleware, wrapperHandler)
		} else {
			this.hono.on(method.toUpperCase(), [path], wrapperHandler)
		}
	}

	private buildRoutePath(prefix: string, version: string, controllerPath: string, methodPath: string): string {
		return normalizePath(`${prefix}${version}${controllerPath}${methodPath}`)
	}

	private formatVersionSegment(version: number | typeof VERSION_NEUTRAL | null): string {
		if (isNil(version)) {
			return ''
		}
		return version === VERSION_NEUTRAL ? '' : `/v${String(version)}`
	}

	async registerController(controllerClass: Constructor): Promise<void> {
		if (!this.metadataRepository.hasController(controllerClass)) {
			throw new Error(`Controller ${controllerClass.name} is not decorated with @Controller()`)
		}

		const controllerPath = this.metadataRepository.getControllerPath(controllerClass) || ''
		const controllerOptions = this.metadataRepository.getControllerOptions(controllerClass) || {}
		const routes = this.metadataRepository.getRoutes(controllerClass) || []
		const parameterMetadata = this.metadataRepository.getParameters(controllerClass) || new Map()
		const contextIndices = this.metadataRepository.getContextIndices(controllerClass) || new Map()

		const controllerSegment = this.normalizePath(controllerPath)

		const controllerInstance = this.container.resolve(controllerClass)

		const effectiveControllerPrefix =
			controllerOptions.prefix !== undefined ? controllerOptions.prefix : this.globalPrefix

		const effectiveControllerVersion =
			controllerOptions.version !== undefined ? controllerOptions.version : this.globalVersion

		if (routes.length === 0) {
			throw new Error(
				`Controller ${controllerClass.name} has no route handlers. Add HTTP method decorators like @Get()`
			)
		}

		for (const route of routes) {
			const { path, method, version: routeVersion, prefix: routePrefix } = route

			const effectivePrefix = routePrefix !== undefined ? routePrefix : effectiveControllerPrefix
			const prefixSegment = !isNil(effectivePrefix) ? this.normalizePath(effectivePrefix) : ''

			const effectiveVersion = routeVersion !== undefined ? routeVersion : effectiveControllerVersion

			const methodSegment = this.normalizePath(path)

			if (isNil(effectiveVersion)) {
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

			if (effectiveVersion === VERSION_NEUTRAL) {
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

			if (Array.isArray(effectiveVersion)) {
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

	private registerRoute(
		controllerInstance: any,
		route: RouteDefinition,
		parameterMetadata: Map<string | symbol, ParameterMetadata[]>,
		contextIndices: Map<string | symbol, number>,
		controllerClass: Constructor,
		prefixSegment: string,
		versionSegment: string,
		controllerSegment: string,
		methodSegment: string,
		method: string
	): void {
		const { handlerName } = route

		const fullPath = this.buildRoutePath(prefixSegment, versionSegment, controllerSegment, methodSegment)

		const handler = controllerInstance[handlerName].bind(controllerInstance)

		const handlerParams = parameterMetadata.get(handlerName) || []
		const contextIndex = contextIndices.get(handlerName)

		const handlerMiddleware = this.componentManager.getHandlerMiddleware(controllerClass, handlerName)

		const handlerPipes = this.componentManager.getHandlerPipes(controllerClass, handlerName)

		this.routeRegistry.registerRoute({
			controller: controllerClass.name,
			handler: handlerName,
			method,
			prefix: prefixSegment,
			version: versionSegment,
			route: controllerSegment,
			path: methodSegment,
			fullPath,
			parameters: handlerParams
		})

		const componentManager = this.componentManager
		const parameterResolver = this.parameterResolver

		const wrapperHandler = async (c: Context) => {
			try {
				c.set(HONEST_PIPELINE_CONTROLLER_KEY, controllerClass)
				c.set(HONEST_PIPELINE_HANDLER_KEY, String(handlerName))

				const guards = componentManager.getHandlerGuards(controllerClass, handlerName)

				for (const guard of guards) {
					const canActivate = await guard.canActivate(c)
					if (!canActivate) {
						throw new HTTPException(403, {
							message: `Forbidden by ${guard.constructor?.name || 'UnknownGuard'} at ${controllerClass.name}.${String(handlerName)}`
						})
					}
				}

				const args = await parameterResolver.resolveArguments({
					controllerName: controllerClass.name,
					handlerName,
					handlerArity: handler.length,
					handlerParams,
					handlerPipes,
					context: c
				})

				const result = await handler(...args)

				if (contextIndex !== undefined) {
					return result
				}

				if (result instanceof Response) {
					return result
				}

				if (isNil(result)) {
					return c.json(null)
				}

				if (isString(result)) {
					return c.text(result)
				}

				return c.json(result)
			} catch (error) {
				return componentManager.handleException(error as Error, c)
			}
		}

		this.registerRouteHandler(method, fullPath, handlerMiddleware, wrapperHandler)
	}
}
