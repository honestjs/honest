import { Hono } from 'hono'
import { ApplicationContext } from './application-context'
import { Container } from './di'
import { ErrorHandler, NotFoundHandler } from './handlers'
import type {
	DiContainer,
	HonestOptions,
	IApplicationContext,
	IPlugin,
	PluginEntry,
	PluginProcessor,
	RouteInfo
} from './interfaces'
import { ComponentManager, RouteManager } from './managers'
import { RouteRegistry, StaticMetadataRepository } from './registries'
import type { Constructor } from './types'
import { isConstructor, isObject } from './utils'

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
	private readonly metadataRepository: StaticMetadataRepository
	private readonly componentManager: ComponentManager
	private readonly routeManager: RouteManager
	private readonly options: HonestOptions

	constructor(options: HonestOptions = {}) {
		this.options = isObject(options) ? options : {}

		this.hono = new Hono(this.options.hono)

		this.container = this.options.container || new Container()

		this.context = new ApplicationContext()

		this.routeRegistry = new RouteRegistry()
		this.metadataRepository = new StaticMetadataRepository()

		this.componentManager = new ComponentManager(this.container, this.metadataRepository)
		this.componentManager.setupGlobalComponents(this.options)

		this.setupErrorHandlers()

		this.routeManager = new RouteManager(
			this.hono,
			this.container,
			this.routeRegistry,
			this.componentManager,
			this.metadataRepository,
			{
				prefix: this.options.routing?.prefix,
				version: this.options.routing?.version
			}
		)

		if (this.options.deprecations?.printPreV1Warning) {
			console.warn('[HonestJS] Pre-v1 warning: APIs may change before 1.0.0.')
		}
	}

	private setupErrorHandlers(): void {
		this.hono.notFound(this.options.notFound || NotFoundHandler.handle())
		this.hono.onError(this.options.onError || ErrorHandler.handle())
	}

	private resolvePlugin(pluginType: Constructor<IPlugin> | IPlugin): IPlugin {
		if (isConstructor(pluginType)) {
			return new (pluginType as Constructor<IPlugin>)()
		}
		return pluginType as IPlugin
	}

	private normalizePluginEntry(entry: PluginEntry): {
		plugin: IPlugin
		preProcessors: PluginProcessor[]
		postProcessors: PluginProcessor[]
	} {
		if (entry && typeof entry === 'object' && 'plugin' in entry) {
			const obj = entry as {
				plugin: IPlugin | Constructor<IPlugin>
				preProcessors?: PluginProcessor[]
				postProcessors?: PluginProcessor[]
			}
			return {
				plugin: this.resolvePlugin(obj.plugin),
				preProcessors: obj.preProcessors ?? [],
				postProcessors: obj.postProcessors ?? []
			}
		}
		return {
			plugin: this.resolvePlugin(entry as IPlugin | Constructor<IPlugin>),
			preProcessors: [],
			postProcessors: []
		}
	}

	async register(moduleClass: Constructor): Promise<Application> {
		const controllers = await this.componentManager.registerModule(moduleClass)

		for (const controller of controllers) {
			await this.routeManager.registerController(controller)
		}

		return this
	}

	static async create(
		rootModule: Constructor,
		options: HonestOptions = {}
	): Promise<{ app: Application; hono: Hono }> {
		const app = new Application(options)
		const entries = (options.plugins || []).map((entry) => app.normalizePluginEntry(entry))
		const ctx = app.getContext()
		const debug = options.debug
		const debugPlugins = debug === true || (typeof debug === 'object' && debug.plugins)
		const debugRoutes = debug === true || (typeof debug === 'object' && debug.routes)

		if (debugPlugins && entries.length > 0) {
			console.info(
				'[HonestJS] Plugin order:',
				entries.map(({ plugin }) => plugin.constructor?.name || 'AnonymousPlugin').join(' -> ')
			)
		}

		for (const { plugin, preProcessors } of entries) {
			for (const fn of preProcessors) {
				await fn(app, app.hono, ctx)
			}
			if (plugin.beforeModulesRegistered) {
				await plugin.beforeModulesRegistered(app, app.hono)
			}
		}

		await app.register(rootModule)

		const routes = app.getRoutes()
		if (options.strict?.requireRoutes && routes.length === 0) {
			throw new Error('Strict mode: no routes were registered. Check your module/controller decorators.')
		}
		if (debugRoutes) {
			console.info(
				'[HonestJS] Registered routes:',
				routes.map((route) => `${route.method.toUpperCase()} ${route.fullPath}`)
			)
		}

		for (const { plugin, postProcessors } of entries) {
			if (plugin.afterModulesRegistered) {
				await plugin.afterModulesRegistered(app, app.hono)
			}
			for (const fn of postProcessors) {
				await fn(app, app.hono, ctx)
			}
		}

		return { app, hono: app.getApp() }
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
