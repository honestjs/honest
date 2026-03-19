import type { Context } from 'hono'
import type { IPipe } from './pipe.interface'
import type { ParameterMetadata } from './parameter-metadata.interface'

/**
 * Input contract for route-parameter resolution.
 */
export interface ParameterResolutionInput {
	controllerName: string
	handlerName: string | symbol
	handlerArity: number
	handlerParams: ReadonlyArray<ParameterMetadata>
	handlerPipes: ReadonlyArray<IPipe>
	context: Context
}
