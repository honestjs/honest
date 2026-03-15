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
import { RouteRegistry } from './registries'
import type { Constructor } from './types'
import { isConstructor, isObject } from './utils'

/**
 * Main application class for the Honest framework
 * Serves as the entry point for creating and configuring web applications
 *
 * Features:
 * - Module-based architecture for organizing application components
 * - Dependency injection container integration
 * - Plugin system for extending functionality
 * - Route management with versioning support
 * - Global error handling
 *
 * @example
 * ```ts
 * const { app } = await Application.create(AppModule, {
 *   routing: { prefix: '/api', version: 1 },
 *   plugins: [new LoggerPlugin()]
 * });
 * ```
 */
export class Application {
	private readonly hono: Hono
	private readonly container: DiContainer
	private readonly context: IApplicationContext
	private readonly routeManager: RouteManager
	private readonly options: HonestOptions

	/**
	 * Creates a new Application instance with the specified configuration
	 * @param options - Configuration options for the application
	 * @param options.routing - Route configuration (prefix, versioning)
	 * @param options.plugins - Array of plugins to extend functionality
	 * @param options.container - Custom dependency injection container
	 * @param options.hono - Hono-specific configuration options
	 * @throws {Error} If options are invalid or initialization fails
	 */
	constructor(options: HonestOptions = {}) {
		this.options = isObject(options) ? options : {}

		// Route registry is process-level static state; clear per app instance
		// so getRoutes() reflects only this app.
		RouteRegistry.clear()

		// Initialize app with Hono options
		this.hono = new Hono(this.options.hono)

		// Initialize container
		this.container = this.options.container || new Container()

		// App-level registry for plugins to share pipeline data by key
		this.context = new ApplicationContext()

		// Set up components and error handlers
		this.setupComponents()
		this.setupErrorHandlers()

		// Initialize the route manager with global options
		this.routeManager = new RouteManager(this.hono, this.container, {
			prefix: this.options.routing?.prefix,
			version: this.options.routing?.version
		})

		if (this.options.deprecations?.printPreV1Warning) {
			console.warn('[HonestJS] Pre-v1 warning: APIs may change before 1.0.0.')
		}
	}

	/**
	 * Sets up global components from application options
	 * Initializes the component manager and registers global middleware,
	 * guards, pipes, and filters
	 * @private
	 */
	private setupComponents(): void {
		ComponentManager.init(this.container)
		ComponentManager.setupGlobalComponents(this.options)
	}

	/**
	 * Sets up global error handlers for the application
	 * Configures handlers for 404 Not Found and general error cases
	 * @private
	 */
	private setupErrorHandlers(): void {
		// Use custom handlers or defaults
		this.hono.notFound(this.options.notFound || NotFoundHandler.handle())
		this.hono.onError(this.options.onError || ErrorHandler.handle())
	}

	/**
	 * Resolves a plugin from either a constructor or instance
	 * @param pluginType - Plugin constructor or instance
	 * @returns Resolved plugin instance
	 * @private
	 * @throws {Error} If plugin instantiation fails
	 */
	private resolvePlugin(pluginType: Constructor<IPlugin> | IPlugin): IPlugin {
		if (isConstructor(pluginType)) {
			return new (pluginType as Constructor<IPlugin>)()
		}
		return pluginType as IPlugin
	}

	/**
	 * Normalizes a plugin entry to a resolved plugin with pre/post processor arrays.
	 * @param entry - Plugin entry (plain plugin or object with plugin and processors)
	 * @returns Normalized entry with plugin instance and processor arrays
	 * @private
	 */
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

	/**
	 * Registers a module with the application
	 * Processes the module's metadata and registers its controllers
	 *
	 * @param moduleClass - The module class to register
	 * @returns The application instance for method chaining
	 * @throws {Error} If module registration fails
	 *
	 * @example
	 * ```ts
	 * const app = new Application();
	 * await app.register(UsersModule)
	 *         .register(AuthModule);
	 * ```
	 */
	async register(moduleClass: Constructor): Promise<Application> {
		// Register the module and get controllers
		const controllers = await ComponentManager.registerModule(moduleClass, this.container)

		// Register controllers with the route manager
		for (const controller of controllers) {
			await this.routeManager.registerController(controller)
		}

		return this
	}

	/**
	 * Creates and initializes a new application with a root module
	 *
	 * Process:
	 * 1. Creates application instance with provided options
	 * 2. Initializes and runs plugin lifecycle hooks
	 * 3. Registers the root module
	 * 4. Returns both the application and Hono instances
	 *
	 * @param rootModule - The root module class for the application
	 * @param options - Application configuration options
	 * @returns Object containing the application and Hono instances
	 * @throws {Error} If application creation or module registration fails
	 *
	 * @example
	 * ```ts
	 * const { app, hono } = await Application.create(AppModule, {
	 *   routing: { prefix: '/api' }
	 * });
	 * ```
	 */
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

		// Phase 1: preProcessors then beforeModulesRegistered for each entry
		for (const { plugin, preProcessors } of entries) {
			for (const fn of preProcessors) {
				await fn(app, app.hono, ctx)
			}
			if (plugin.beforeModulesRegistered) {
				await plugin.beforeModulesRegistered(app, app.hono)
			}
		}

		// Register the root module and its routes
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

		// Phase 2: afterModulesRegistered then postProcessors for each entry
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

	/**
	 * Gets the underlying Hono instance for direct access
	 * Use this method when you need to access Hono-specific features
	 *
	 * @returns The Hono application instance
	 * @example
	 * ```ts
	 * const hono = app.getApp();
	 * hono.use(someHonoMiddleware());
	 * ```
	 */
	getApp(): Hono {
		return this.hono
	}

	/**
	 * Gets the app-level registry (context) where your app can publish and read pipeline data by key.
	 * Use namespaced keys (e.g. 'app.config', 'openapi.spec') and document contracts in your app.
	 *
	 * @returns The application context instance
	 * @example
	 * ```ts
	 * app.getContext().set('app.config', { env: process.env.NODE_ENV })
	 * const config = app.getContext().get<{ env: string }>('app.config')
	 * ```
	 */
	getContext(): IApplicationContext {
		return this.context
	}

	/**
	 * Gets information about all registered routes in the application
	 * Useful for documentation and debugging purposes
	 *
	 * @returns Array of route information objects (read-only)
	 * @example
	 * ```ts
	 * const routes = app.getRoutes();
	 * console.log(routes.map(r => r.path));
	 * ```
	 */
	getRoutes(): ReadonlyArray<RouteInfo> {
		return RouteRegistry.getRoutes()
	}
}
