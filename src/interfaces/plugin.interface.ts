import type { Hono } from 'hono'
import type { Application } from '../application'
import type { Constructor } from '../types'

/**
 * Interface for Honest framework plugins
 * Plugins can extend the framework's functionality by hooking into
 * different stages of the application lifecycle
 */
export interface IPlugin {
	/**
	 * Hook that runs before module registration begins
	 * Use this to set up plugin functionality that modules might depend on
	 * @param app - The Honest application instance
	 * @param hono - The underlying Hono application instance
	 * @returns Void or a Promise that resolves to void
	 */
	beforeModulesRegistered?: (app: Application, hono: Hono) => void | Promise<void>

	/**
	 * Hook that runs after all modules have been registered
	 * Use this to perform cleanup or setup that requires all modules to be ready
	 * @param app - The Honest application instance
	 * @param hono - The underlying Hono application instance
	 * @returns Void or a Promise that resolves to void
	 */
	afterModulesRegistered?: (app: Application, hono: Hono) => void | Promise<void>
}

/**
 * Type for plugin implementations
 * Can be either a class implementing IPlugin or an instance of IPlugin
 */
export type PluginType = Constructor<IPlugin> | IPlugin
