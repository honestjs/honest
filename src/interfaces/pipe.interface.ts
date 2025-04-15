import type { Constructor } from '../types'

/**
 * Metadata about an argument being processed by a pipe
 */
export interface ArgumentMetadata {
	/**
	 * The type of argument (body, query, param, or custom)
	 */
	type: 'body' | 'query' | 'param' | 'custom'

	/**
	 * The class type of the argument
	 */
	metatype?: Constructor<unknown>

	/**
	 * Additional data about the argument
	 */
	data?: string
}

/**
 * Interface for transformation pipes
 * Pipes transform input data before it reaches the route handler
 */
export interface IPipe {
	/**
	 * Transforms the input value according to the pipe's logic
	 * @param value - The value to transform
	 * @param metadata - Metadata about the argument being transformed
	 * @returns The transformed value, which can be synchronous or asynchronous
	 * @throws {Error} If the transformation fails or validation fails
	 */
	transform(value: unknown, metadata: ArgumentMetadata): Promise<unknown> | unknown
}

/**
 * Type for pipe implementations
 * Can be either a class implementing IPipe or an instance of IPipe
 */
export type PipeType = Constructor<IPipe> | IPipe
