import type { Context } from 'hono'
import type { ParameterMetadata } from '../interfaces'
import { MetadataRegistry } from '../registries'
import type { Constructor } from '../types'

/**
 * Creates a parameter decorator factory for route handlers
 * @template T - The type of the parameter value after transformation
 * @param type - The type identifier for the parameter
 * @param factory - Optional function to transform the parameter value
 * @returns A parameter decorator function that registers parameter metadata
 * @example
 * ```ts
 * const Body = createParamDecorator('body', async (data, ctx) => {
 *   const body = await ctx.req.json();
 *   return data ? body[data] : body;
 * });
 * ```
 */
export function createParamDecorator<T = any>(type: string, factory?: (data: any, ctx: Context) => T) {
	return (data?: any) => {
		return (target: Object, propertyKey: string | symbol, parameterIndex: number): void => {
			const controllerClass = target.constructor as Constructor

			// Initialize parameters map for the controller if not exists
			if (!MetadataRegistry.getParameters(controllerClass).size) {
				MetadataRegistry.setParameterMap(controllerClass, new Map())
			}

			const parametersMap = MetadataRegistry.getParameters(controllerClass)

			// Initialize parameter metadata array for the method if not exists
			if (!parametersMap.has(propertyKey)) {
				parametersMap.set(propertyKey, [])
			}

			// Get the parameter type from the method signature using reflect-metadata
			const paramTypes = Reflect.getMetadata('design:paramtypes', target, propertyKey)
			const metatype = paramTypes?.[parameterIndex]

			// Add parameter metadata
			const parameters = parametersMap.get(propertyKey)!
			parameters.push({
				index: parameterIndex,
				name: type,
				data,
				factory,
				metatype
			} as ParameterMetadata)

			// If it's a context parameter, track its index
			if (type === 'context') {
				if (!MetadataRegistry.getContextIndices(controllerClass).size) {
					MetadataRegistry.setContextIndices(controllerClass, new Map())
				}
				const contextIndices = MetadataRegistry.getContextIndices(controllerClass)
				contextIndices.set(propertyKey, parameterIndex)
			}
		}
	}
}
