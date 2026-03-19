import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { HONEST_PIPELINE_CONTROLLER_KEY, HONEST_PIPELINE_HANDLER_KEY } from '../constants'
import { NoopDiagnosticsEmitter } from '../diagnostics'
import type { IDiagnosticsEmitter, ParameterMetadata } from '../interfaces'
import type { IPipe } from '../interfaces'
import { ComponentManager } from './component.manager'
import { HandlerInvoker } from './handler.invoker'
import { ParameterResolver } from './parameter.resolver'
import type { Constructor } from '../types'

export interface PipelineExecutionInput {
	controllerClass: Constructor
	handlerName: string | symbol
	handler: (...args: unknown[]) => Promise<unknown> | unknown
	handlerParams: ReadonlyArray<ParameterMetadata>
	handlerPipes: ReadonlyArray<IPipe>
	contextIndex?: number
	context: Context
}

/**
 * Executes guard, parameter-resolution, and handler invocation stages.
 */
export class PipelineExecutor {
	constructor(
		private readonly componentManager: ComponentManager,
		private readonly parameterResolver: ParameterResolver,
		private readonly handlerInvoker: HandlerInvoker,
		private readonly diagnosticsEmitter: IDiagnosticsEmitter = new NoopDiagnosticsEmitter(),
		private readonly debugPipeline = false
	) {}

	async execute(input: PipelineExecutionInput): Promise<unknown> {
		const { controllerClass, handlerName, handler, handlerParams, handlerPipes, contextIndex, context } = input

		context.set(HONEST_PIPELINE_CONTROLLER_KEY, controllerClass)
		context.set(HONEST_PIPELINE_HANDLER_KEY, String(handlerName))

		const guards = this.componentManager.getHandlerGuards(controllerClass, handlerName)

		for (const guard of guards) {
			const canActivate = await guard.canActivate(context)
			if (!canActivate) {
				if (this.debugPipeline) {
					this.diagnosticsEmitter.emit({
						level: 'warn',
						category: 'pipeline',
						message: `Guard rejected request at ${controllerClass.name}.${String(handlerName)}`,
						details: { guard: guard.constructor?.name || 'UnknownGuard' }
					})
				}
				throw new HTTPException(403, {
					message: `Forbidden by ${guard.constructor?.name || 'UnknownGuard'} at ${controllerClass.name}.${String(handlerName)}`
				})
			}
		}

		const args = await this.parameterResolver.resolveArguments({
			controllerName: controllerClass.name,
			handlerName,
			handlerArity: handler.length,
			handlerParams,
			handlerPipes,
			context
		})

		if (this.debugPipeline) {
			this.diagnosticsEmitter.emit({
				level: 'debug',
				category: 'pipeline',
				message: `Resolved handler arguments for ${controllerClass.name}.${String(handlerName)}`,
				details: {
					guardCount: guards.length,
					parameterCount: handlerParams.length,
					pipeCount: handlerPipes.length
				}
			})
		}

		return this.handlerInvoker.invoke({
			handler,
			args,
			context,
			contextIndex
		})
	}
}
