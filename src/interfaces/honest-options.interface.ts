import type { Context } from 'hono'
import type { VERSION_NEUTRAL } from '../constants'
import type { FilterType, GuardType, ILogger, MiddlewareType, PipeType, PluginEntry } from '../interfaces'
import type { DiContainer } from './di-container.interface'

/**
 * Options for configuring the Honest application
 */
export interface HonestOptions {
	/**
	 * Emit actionable startup guidance when initialization fails.
	 * - `true` enables concise hints
	 * - object form enables verbose hints with additional context
	 */
	startupGuide?: boolean | { verbose?: boolean }

	/**
	 * Enable debug logging for startup diagnostics.
	 * - `true` enables all debug logs
	 * - object form enables specific categories
	 */
	debug?: boolean | { routes?: boolean; plugins?: boolean; pipeline?: boolean; di?: boolean; startup?: boolean }

	/**
	 * Optional logger for structured framework events.
	 */
	logger?: ILogger

	/**
	 * Optional strict-mode checks for startup validation.
	 */
	strict?: {
		/**
		 * When enabled, startup fails if no routes were registered.
		 */
		requireRoutes?: boolean
	}

	/**
	 * Optional warnings for unstable/deprecated behavior.
	 */
	deprecations?: {
		/**
		 * Print pre-v1 instability warning during startup.
		 */
		printPreV1Warning?: boolean
	}

	/**
	 * Container instance for dependency injection
	 */
	container?: DiContainer

	/**
	 * Hono-specific options
	 */
	hono?: {
		/**
		 * Whether to use strict matching for routes
		 */
		strict?: boolean
		/**
		 * Custom router to use
		 */
		router?: any
		/**
		 * Function to extract path from request
		 */
		getPath?: (request: Request, options?: any) => string
	}

	/**
	 * Global routing options
	 */
	routing?: {
		/**
		 * Global API prefix to apply to all routes (e.g. /api)
		 */
		prefix?: string

		/**
		 * Global API version to apply to all routes (e.g. 1 becomes /v1)
		 * Set to VERSION_NEUTRAL to make routes accessible both with and without version prefix
		 * Set to an array of numbers to make routes available at multiple versions
		 */
		version?: number | typeof VERSION_NEUTRAL | number[]
	}

	/**
	 * Global components to apply to all routes
	 */
	components?: {
		/**
		 * Global middleware to apply to all routes
		 */
		middleware?: MiddlewareType[]

		/**
		 * Global guards to apply to all routes
		 */
		guards?: GuardType[]

		/**
		 * Global pipes to apply to all routes
		 */
		pipes?: PipeType[]

		/**
		 * Global exception filters to apply to all routes
		 */
		filters?: FilterType[]
	}

	/**
	 * Plugins for extending the application functionality.
	 * Each entry can be a plain plugin or an object with plugin and optional pre/post processors.
	 */
	plugins?: PluginEntry[]

	/**
	 * Default exception handler to use when no filter matches
	 */
	onError?: (error: unknown, context: Context) => Response | Promise<Response>

	/**
	 * Default not found handler for routes that don't match any pattern
	 */
	notFound?: (context: Context) => Response | Promise<Response>
}
