import type { VERSION_NEUTRAL } from '../constants'

/**
 * Interface for controller configuration options
 */
export interface ControllerOptions {
	/**
	 * API prefix for this controller's routes, overrides global prefix
	 */
	prefix?: string | null

	/**
	 * API version for this controller's routes (e.g. 1 becomes /v1), overrides global version
	 * Set to null to explicitly opt out of versioning even when global version is set
	 * Set to VERSION_NEUTRAL to make routes accessible both with and without version prefix
	 * Set to an array of numbers to make routes available at multiple versions
	 */
	version?: number | null | typeof VERSION_NEUTRAL | number[]
}
