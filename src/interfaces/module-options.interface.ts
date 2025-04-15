import type { Constructor } from '../types'

/**
 * Options for configuring a module
 */
export interface ModuleOptions {
	/**
	 * List of controller classes
	 */
	controllers?: Constructor[]
	/**
	 * List of service classes
	 */
	services?: Constructor[]
	/**
	 * List of imported modules
	 */
	imports?: Constructor[]
}
