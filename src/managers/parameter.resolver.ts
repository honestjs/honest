import type { ParameterResolutionInput } from '../interfaces'
import { ComponentManager } from './component.manager'

/**
 * Resolves route handler arguments from parameter decorator metadata.
 */
export class ParameterResolver {
	constructor(private readonly componentManager: ComponentManager) {}

	async resolveArguments(input: ParameterResolutionInput): Promise<unknown[]> {
		const { controllerName, handlerName, handlerArity, handlerParams, handlerPipes, context } = input

		const maxDecoratorIndex =
			handlerParams.length > 0 ? Math.max(...handlerParams.map((parameter) => parameter.index)) : -1
		const args: unknown[] = new Array(Math.max(handlerArity, maxDecoratorIndex + 1))

		for (const parameter of handlerParams) {
			if (typeof parameter.factory !== 'function') {
				throw new Error(`Invalid parameter decorator metadata for ${controllerName}.${String(handlerName)}`)
			}

			const rawValue = await parameter.factory(parameter.data, context)

			const transformedValue = await this.componentManager.executePipes(
				rawValue,
				{
					type: parameter.name,
					metatype: parameter.metatype,
					data:
						typeof parameter.data === 'string' || typeof parameter.data === 'undefined'
							? parameter.data
							: String(parameter.data)
				},
				handlerPipes
			)

			args[parameter.index] = transformedValue
		}

		return args
	}
}
