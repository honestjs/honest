import type { Constructor } from '../types'

/**
 * Request-scoped keys used by the framework pipeline.
 */
export interface PipelineContextValues {
	controllerClass?: Constructor
	handlerName?: string
	bodyCache?: unknown
}
