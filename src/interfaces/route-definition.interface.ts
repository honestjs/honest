import type { VERSION_NEUTRAL } from '../constants'
import type { ParameterMetadata } from '../interfaces'

/**
 * Metadata for defining a route
 */
export interface RouteDefinition {
	/**
	 * Route path
	 */
	path: string
	/**
	 * HTTP method
	 */
	method: string
	/**
	 * Handler method name
	 */
	handlerName: string | symbol
	/**
	 * Parameter metadata for the handler
	 */
	parameterMetadata: ParameterMetadata[]
	/**
	 * Route-specific API version, overrides controller and global version
	 * Set to null to explicitly opt out of versioning
	 * Set to VERSION_NEUTRAL to make the route accessible both with and without version prefix
	 * Set to an array of numbers to make the route available at multiple versions
	 */
	version?: number | null | typeof VERSION_NEUTRAL | number[]
}
