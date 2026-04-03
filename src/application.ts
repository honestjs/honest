import { Hono } from 'hono'
import { emitStartupGuide as emitStartupGuideLogs } from './application/startup-guide'
import { normalizePluginEntries } from './application/plugin-entries'
import { ApplicationContext } from './application-context'
import { ConsoleLogger } from './loggers'
import { Container } from './di'
import { ErrorHandler, NotFoundHandler } from './handlers'
import type {
	ILogger,
	DiContainer,
	HonestOptions,
	IApplicationContext,
	IMetadataRepository,
	RouteInfo
} from './interfaces'
import { ComponentManager, RouteManager } from './managers'
import { RouteRegistry, SnapshotMetadataRepository, StaticMetadataRepository } from './registries'
import type { Constructor } from './types'
import { isObject } from './utils'

/**
 * Main application class for the Honest framework.
 *
 * All per-app runtime state (routes, global components, DI container) is
 * instance-based. Static decorator metadata lives in MetadataRegistry and
 * is shared across all Application instances in the same process.
 */
export class Application {
	private readonly hono: Hono
	private readonly container: DiContainer
	private readonly context: IApplicationContext
	private readonly routeRegistry: RouteRegistry
	private readonly metadataRepository: IMetadataRepository
	private readonly componentManager: ComponentManager
	private readonly routeManager: RouteManager
	private readonly logger: ILogger
	private readonly options: HonestOptions

	constructor(options: HonestOptions = {}, metadataRepository: IMetadataRepository = new StaticMetadataRepository()) {
		this.options = isObject(options) ? options : {}

		const debugPipeline =
			this.options.debug === true ||
			(typeof this.options.debug === 'object' && Boolean(this.options.debug.pipeline))
		const debugDi =
			this.options.debug === true || (typeof this.options.debug === 'object' && Boolean(this.options.debug.di))

		this.hono = new Hono(this.options.hono)

		this.logger = this.options.logger || new ConsoleLogger()

		this.container = this.options.container || new Container(undefined, this.logger, debugDi)

		this.context = new ApplicationContext()

		this.routeRegistry = new RouteRegistry()
		this.metadataRepository = metadataRepository

		this.componentManager = new ComponentManager(this.container, this.metadataRepository, this.logger)
		this.componentManager.setupGlobalComponents(this.options)

		this.setupErrorHandlers()

		this.routeManager = new RouteManager(
			this.hono,
			this.container,
			this.routeRegistry,
			this.componentManager,
			this.metadataRepository,
			this.logger,
			{
				prefix: this.options.routing?.prefix,
				version: this.options.routing?.version,
				debugPipeline
			}
		)

		if (this.options.deprecations?.printPreV1Warning) {
			this.logger.emit({
				level: 'warn',
				category: 'deprecations',
				message: 'Pre-v1 warning: APIs may change before 1.0.0.'
			})
		}
	}

	private setupErrorHandlers(): void {
		this.hono.notFound(this.options.notFound || NotFoundHandler.handle())
		this.hono.onError(this.options.onError || ErrorHandler.handle())
	}

	private shouldEmitRouteDiagnostics(): boolean {
		const debug = this.options.debug
		return debug === true || (typeof debug === 'object' && Boolean(debug.routes))
	}

	private emitStartupGuide(error: unknown, rootModule: Constructor): void {
		emitStartupGuideLogs(this.logger, this.options.startupGuide, error, rootModule)
	}

	async register(moduleClass: Constructor): Promise<Application> {
		const controllers = await this.componentManager.registerModule(moduleClass)
		const debugRoutes = this.shouldEmitRouteDiagnostics()

		for (const controller of controllers) {
			const controllerStartedAt = Date.now()
			const routeCountBefore = this.routeRegistry.getRoutes().length
			try {
				await this.routeManager.registerController(controller)
				if (debugRoutes) {
					this.logger.emit({
						level: 'info',
						category: 'routes',
						message: 'Registered controller routes',
						details: {
							controller: controller.name,
							routeCountAdded: this.routeRegistry.getRoutes().length - routeCountBefore,
							registrationDurationMs: Date.now() - controllerStartedAt
						}
					})
				}
			} catch (error: unknown) {
				if (debugRoutes) {
					this.logger.emit({
						level: 'error',
						category: 'routes',
						message: 'Failed to register controller routes',
						details: {
							controller: controller.name,
							registrationDurationMs: Date.now() - controllerStartedAt,
							errorMessage: error instanceof Error ? error.message : String(error)
						}
					})
				}
				throw error
			}
		}

		return this
	}

	static async create(
		rootModule: Constructor,
		options: HonestOptions = {}
	): Promise<{ app: Application; hono: Hono }> {
		const startupStartedAt = Date.now()
		const metadataSnapshot = SnapshotMetadataRepository.fromRootModule(rootModule)
		const app = new Application(options, metadataSnapshot)
		const entries = normalizePluginEntries(options.plugins)
		const ctx = app.getContext()
		const debug = options.debug
		const debugPlugins = debug === true || (typeof debug === 'object' && debug.plugins)
		const debugRoutes = debug === true || (typeof debug === 'object' && debug.routes)
		const debugStartup = debug === true || (typeof debug === 'object' && (debug.startup || debugRoutes))
		let strictNoRoutesFailureEmitted = false

		try {
			if (debugPlugins && entries.length > 0) {
				app.logger.emit({
					level: 'info',
					category: 'plugins',
					message: `Plugin order: ${entries.map(({ name }) => name).join(' -> ')}`
				})
			}

			for (const { plugin, preProcessors } of entries) {
				plugin.logger = app.logger
				for (const fn of preProcessors) {
					await fn(app, app.hono, ctx)
				}
				if (plugin.beforeModulesRegistered) {
					await plugin.beforeModulesRegistered(app, app.hono)
				}
			}

			await app.register(rootModule)

			const routes = app.getRoutes()
			if (debugStartup) {
				app.logger.emit({
					level: 'info',
					category: 'startup',
					message: `Application registered ${routes.length} route(s)`,
					details: {
						routeCount: routes.length,
						rootModule: rootModule.name
					}
				})
			}
			if (options.strict?.requireRoutes && routes.length === 0) {
				strictNoRoutesFailureEmitted = true
				app.logger.emit({
					level: 'error',
					category: 'startup',
					message: 'Strict mode failed: no routes were registered',
					details: {
						rootModule: rootModule.name,
						requireRoutes: true,
						startupDurationMs: Date.now() - startupStartedAt
					}
				})
				const strictError = new Error(
					'Strict mode: no routes were registered. Check your module/controller decorators.'
				)
				app.emitStartupGuide(strictError, rootModule)
				throw strictError
			}
			if (debugRoutes) {
				app.logger.emit({
					level: 'info',
					category: 'routes',
					message: 'Registered routes',
					details: {
						routes: routes.map((route) => `${route.method.toUpperCase()} ${route.fullPath}`)
					}
				})
			}

			for (const { plugin, postProcessors } of entries) {
				if (plugin.afterModulesRegistered) {
					await plugin.afterModulesRegistered(app, app.hono)
				}
				for (const fn of postProcessors) {
					await fn(app, app.hono, ctx)
				}
			}

			if (debugStartup) {
				app.logger.emit({
					level: 'info',
					category: 'startup',
					message: 'Application startup completed',
					details: {
						rootModule: rootModule.name,
						pluginCount: entries.length,
						routeCount: routes.length,
						startupDurationMs: Date.now() - startupStartedAt
					}
				})
			}

			return { app, hono: app.getApp() }
		} catch (error: unknown) {
			app.emitStartupGuide(error, rootModule)

			if (debugStartup && !strictNoRoutesFailureEmitted) {
				app.logger.emit({
					level: 'error',
					category: 'startup',
					message: 'Application startup failed',
					details: {
						rootModule: rootModule.name,
						startupDurationMs: Date.now() - startupStartedAt,
						errorMessage: error instanceof Error ? error.message : String(error)
					}
				})
			}
			throw error
		}
	}

	getApp(): Hono {
		return this.hono
	}

	getContainer(): DiContainer {
		return this.container
	}

	getContext(): IApplicationContext {
		return this.context
	}

	getRoutes(): ReadonlyArray<RouteInfo> {
		return this.routeRegistry.getRoutes()
	}
}
