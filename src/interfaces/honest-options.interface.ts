import type { Context } from 'hono'
import type { VERSION_NEUTRAL } from '../constants'
import type { FilterType, GuardType, MiddlewareType, PipeType, PluginType } from '../interfaces'
import type { DiContainer } from './di-container.interface'

/**
 * Options for configuring the Honest application
 */
export interface HonestOptions {
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
	 * Plugins for extending the application functionality
	 */
	plugins?: PluginType[]

	/**
	 * Default exception handler to use when no filter matches
	 */
	onError?: (error: Error, context: Context) => Response | Promise<Response>

	/**
	 * Default not found handler for routes that don't match any pattern
	 */
	notFound?: (context: Context) => Response | Promise<Response>
}
