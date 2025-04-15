import type { Constructor } from '../types'

import type { Context } from 'hono'

/**
 * Metadata for route parameters
 */
export interface ParameterMetadata {
	/**
	 * Parameter index
	 */
	index: number
	/**
	 * Parameter name (body, param, query, etc.)
	 */
	name: string
	/**
	 * Additional parameter data (e.g., param name)
	 */
	data?: any
	/**
	 * Optional factory function to transform the data
	 */
	factory: (data: any, ctx: Context) => any
	/**
	 * The class type of the parameter
	 */
	metatype?: Constructor<unknown>
}
