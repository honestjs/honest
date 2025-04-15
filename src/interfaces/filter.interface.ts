import type { Context } from 'hono'
import type { Constructor } from '../types'

/**
 * Interface for exception filters
 * Filters handle and transform exceptions thrown during request processing
 */
export interface IFilter {
	/**
	 * Method to catch and handle exceptions
	 * @param exception - The exception that was thrown
	 * @param context - The Hono context object
	 * @returns A Response object or undefined if the exception should be passed to the next filter
	 */
	catch(exception: Error, context: Context): Promise<Response | undefined> | Response | undefined
}

/**
 * Type for exception filters
 * Can be either a class implementing IFilter or an instance of IFilter
 */
export type FilterType = Constructor<IFilter> | IFilter
