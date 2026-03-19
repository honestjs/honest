import { Hono } from 'hono'
import { ApplicationContext } from './application-context'
import { ConsoleDiagnosticsEmitter } from './diagnostics'
import { Container } from './di'
import { ErrorHandler, NotFoundHandler } from './handlers'
import type {
	IDiagnosticsEmitter,
	DiContainer,
	HonestOptions,
	IApplicationContext,
	IMetadataRepository,
	IPlugin,
	PluginEntry,
	PluginProcessor,
	RouteInfo
} from './interfaces'
import { ComponentManager, RouteManager } from './managers'
import { RouteRegistry, SnapshotMetadataRepository, StaticMetadataRepository } from './registries'
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
	private readonly metadataRepository: IMetadataRepository
	private readonly componentManager: ComponentManager
	private readonly routeManager: RouteManager
	private readonly diagnosticsEmitter: IDiagnosticsEmitter
	private readonly options: HonestOptions

	private static readonly DEFAULT_PLUGIN_NAME = 'AnonymousPlugin'

	constructor(options: HonestOptions = {}, metadataRepository: IMetadataRepository = new StaticMetadataRepository()) {
		this.options = isObject(options) ? options : {}

		const debugPipeline =
			this.options.debug === true ||
			(typeof this.options.debug === 'object' && Boolean(this.options.debug.pipeline))
		const debugDi =
			this.options.debug === true || (typeof this.options.debug === 'object' && Boolean(this.options.debug.di))

		this.hono = new Hono(this.options.hono)

		this.diagnosticsEmitter = this.options.diagnostics || new ConsoleDiagnosticsEmitter()

		this.container = this.options.container || new Container(undefined, this.diagnosticsEmitter, debugDi)

		this.context = new ApplicationContext()

		this.routeRegistry = new RouteRegistry()
		this.metadataRepository = metadataRepository

		this.componentManager = new ComponentManager(this.container, this.metadataRepository, this.diagnosticsEmitter)
		this.componentManager.setupGlobalComponents(this.options)

		this.setupErrorHandlers()

		this.routeManager = new RouteManager(
			this.hono,
			this.container,
			this.routeRegistry,
			this.componentManager,
			this.metadataRepository,
			this.diagnosticsEmitter,
			{
				prefix: this.options.routing?.prefix,
				version: this.options.routing?.version,
				debugPipeline
			}
		)

		if (this.options.deprecations?.printPreV1Warning) {
			this.diagnosticsEmitter.emit({
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

	private resolvePlugin(pluginType: Constructor<IPlugin> | IPlugin): IPlugin {
		if (isConstructor(pluginType)) {
			return new (pluginType as Constructor<IPlugin>)()
		}
		return pluginType as IPlugin
	}

	private normalizePluginEntry(
		entry: PluginEntry,
		index: number
	): {
		plugin: IPlugin
		name: string
		before: string[]
		after: string[]
		provides: string[]
		requires: string[]
		index: number
		preProcessors: PluginProcessor[]
		postProcessors: PluginProcessor[]
	} {
		if (entry && typeof entry === 'object' && 'plugin' in entry) {
			const obj = entry as {
				plugin: IPlugin | Constructor<IPlugin>
				name?: string
				before?: string[]
				after?: string[]
				preProcessors?: PluginProcessor[]
				postProcessors?: PluginProcessor[]
			}
			const plugin = this.resolvePlugin(obj.plugin)
			const name = this.resolvePluginName(plugin, index, obj.name)
			return {
				plugin,
				name,
				before: obj.before ?? [],
				after: obj.after ?? [],
				provides: plugin.meta?.provides ?? [],
				requires: plugin.meta?.requires ?? [],
				index,
				preProcessors: obj.preProcessors ?? [],
				postProcessors: obj.postProcessors ?? []
			}
		}
		const plugin = this.resolvePlugin(entry as IPlugin | Constructor<IPlugin>)
		return {
			plugin,
			name: this.resolvePluginName(plugin, index),
			before: [],
			after: [],
			provides: plugin.meta?.provides ?? [],
			requires: plugin.meta?.requires ?? [],
			index,
			preProcessors: [],
			postProcessors: []
		}
	}

	private resolvePluginName(plugin: IPlugin, index: number, override?: string): string {
		const resolved = override || plugin.meta?.name || plugin.constructor?.name
		if (!resolved || resolved === Application.DEFAULT_PLUGIN_NAME) {
			return `${Application.DEFAULT_PLUGIN_NAME}#${index + 1}`
		}
		return resolved
	}

	private resolvePluginExecutionOrder(
		entries: Array<{
			plugin: IPlugin
			name: string
			before: string[]
			after: string[]
			provides: string[]
			requires: string[]
			index: number
			preProcessors: PluginProcessor[]
			postProcessors: PluginProcessor[]
		}>
	): Array<{
		plugin: IPlugin
		name: string
		before: string[]
		after: string[]
		provides: string[]
		requires: string[]
		index: number
		preProcessors: PluginProcessor[]
		postProcessors: PluginProcessor[]
	}> {
		if (entries.length === 0) {
			return entries
		}

		const byName = new Map<string, number>()
		for (let i = 0; i < entries.length; i++) {
			const entry = entries[i]
			if (byName.has(entry.name)) {
				throw new Error(
					`Duplicate plugin name detected: ${entry.name}. Use unique plugin names in options.plugins.`
				)
			}
			byName.set(entry.name, i)
		}

		const indegree = new Array<number>(entries.length).fill(0)
		const edges = new Map<number, Set<number>>()

		const addEdge = (from: number, to: number): void => {
			if (!edges.has(from)) {
				edges.set(from, new Set())
			}
			const targets = edges.get(from)!
			if (!targets.has(to)) {
				targets.add(to)
				indegree[to]++
			}
		}

		for (let i = 0; i < entries.length; i++) {
			const entry = entries[i]
			for (const dep of entry.after) {
				const from = byName.get(dep)
				if (from === undefined) {
					throw new Error(
						`Plugin ordering error: ${entry.name} declares after '${dep}', but no such plugin is registered.`
					)
				}
				addEdge(from, i)
			}
			for (const dep of entry.before) {
				const to = byName.get(dep)
				if (to === undefined) {
					throw new Error(
						`Plugin ordering error: ${entry.name} declares before '${dep}', but no such plugin is registered.`
					)
				}
				addEdge(i, to)
			}
		}

		const queue: number[] = []
		for (let i = 0; i < entries.length; i++) {
			if (indegree[i] === 0) {
				queue.push(i)
			}
		}

		queue.sort((a, b) => entries[a].index - entries[b].index)
		const sortedIndexes: number[] = []

		while (queue.length > 0) {
			const index = queue.shift()!
			sortedIndexes.push(index)

			const nextSet = edges.get(index)
			if (!nextSet) {
				continue
			}

			for (const next of nextSet) {
				indegree[next]--
				if (indegree[next] === 0) {
					queue.push(next)
				}
			}

			queue.sort((a, b) => entries[a].index - entries[b].index)
		}

		if (sortedIndexes.length !== entries.length) {
			throw new Error('Plugin ordering cycle detected. Check before/after constraints in options.plugins.')
		}

		return sortedIndexes.map((i) => entries[i])
	}

	private validatePluginCapabilities(
		entries: Array<{
			name: string
			provides: string[]
			requires: string[]
		}>
	): void {
		if (entries.length === 0) {
			return
		}

		const provided = new Set<string>()
		for (const entry of entries) {
			for (const required of entry.requires) {
				if (!provided.has(required)) {
					throw new Error(
						`Plugin capability error: ${entry.name} requires '${required}', but it was not provided by any previous plugin. ` +
							'Use before/after ordering or register the provider plugin earlier.'
					)
				}
			}
			for (const capability of entry.provides) {
				provided.add(capability)
			}
		}
	}

	private shouldEmitRouteDiagnostics(): boolean {
		const debug = this.options.debug
		return debug === true || (typeof debug === 'object' && Boolean(debug.routes))
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
					this.diagnosticsEmitter.emit({
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
					this.diagnosticsEmitter.emit({
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
		const entries = (options.plugins || []).map((entry, index) => app.normalizePluginEntry(entry, index))
		const orderedEntries = app.resolvePluginExecutionOrder(entries)
		app.validatePluginCapabilities(orderedEntries)
		const ctx = app.getContext()
		const debug = options.debug
		const debugPlugins = debug === true || (typeof debug === 'object' && debug.plugins)
		const debugRoutes = debug === true || (typeof debug === 'object' && debug.routes)
		const debugStartup = debug === true || (typeof debug === 'object' && (debug.startup || debugRoutes))
		let strictNoRoutesFailureEmitted = false

		try {
			if (debugPlugins && orderedEntries.length > 0) {
				app.diagnosticsEmitter.emit({
					level: 'info',
					category: 'plugins',
					message: `Plugin order: ${orderedEntries.map(({ name }) => name).join(' -> ')}`
				})
			}

			for (const { plugin, preProcessors } of orderedEntries) {
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
				app.diagnosticsEmitter.emit({
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
				app.diagnosticsEmitter.emit({
					level: 'error',
					category: 'startup',
					message: 'Strict mode failed: no routes were registered',
					details: {
						rootModule: rootModule.name,
						requireRoutes: true,
						startupDurationMs: Date.now() - startupStartedAt
					}
				})
				throw new Error('Strict mode: no routes were registered. Check your module/controller decorators.')
			}
			if (debugRoutes) {
				app.diagnosticsEmitter.emit({
					level: 'info',
					category: 'routes',
					message: 'Registered routes',
					details: {
						routes: routes.map((route) => `${route.method.toUpperCase()} ${route.fullPath}`)
					}
				})
			}

			for (const { plugin, postProcessors } of orderedEntries) {
				if (plugin.afterModulesRegistered) {
					await plugin.afterModulesRegistered(app, app.hono)
				}
				for (const fn of postProcessors) {
					await fn(app, app.hono, ctx)
				}
			}

			if (debugStartup) {
				app.diagnosticsEmitter.emit({
					level: 'info',
					category: 'startup',
					message: 'Application startup completed',
					details: {
						rootModule: rootModule.name,
						pluginCount: orderedEntries.length,
						routeCount: routes.length,
						startupDurationMs: Date.now() - startupStartedAt
					}
				})
			}

			return { app, hono: app.getApp() }
		} catch (error: unknown) {
			if (debugStartup && !strictNoRoutesFailureEmitted) {
				app.diagnosticsEmitter.emit({
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
