import type { VERSION_NEUTRAL } from '../constants'

/**
 * Options for HTTP method decorators
 */
export interface HttpMethodOptions {
	/**
	 * API version for this specific route, overrides controller and global version
	 * Set to null to explicitly opt out of versioning
	 * Set to VERSION_NEUTRAL to make the route accessible both with and without version prefix
	 * Set to an array of numbers to make the route available at multiple versions
	 */
	version?: number | null | typeof VERSION_NEUTRAL | number[]
}
