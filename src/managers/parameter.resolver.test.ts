import { describe, expect, test } from 'bun:test'
import type { Context } from 'hono'
import { Container } from '../di'
import type { ILogger, IMetadataRepository, LogEvent, ParameterMetadata } from '../interfaces'
import type { IPipe } from '../interfaces'
import { MetadataRegistry } from '../registries'
import { ComponentManager } from './component.manager'
import { ParameterResolver } from './parameter.resolver'

const liveMetadataRepository: IMetadataRepository = {
	hasController: (c) => MetadataRegistry.hasController(c),
	getControllerPath: (c) => MetadataRegistry.getControllerPath(c),
	getControllerOptions: (c) => MetadataRegistry.getControllerOptions(c),
	getRoutes: (c) => MetadataRegistry.getRoutes(c),
	getParameters: (c) => MetadataRegistry.getParameters(c),
	getContextIndices: (c) => MetadataRegistry.getContextIndices(c),
	getModuleOptions: (m) => MetadataRegistry.getModuleOptions(m),
	getControllerComponents: (type, controller) => MetadataRegistry.getController(type, controller) as any,
	getHandlerComponents: (type, controller, handlerName) =>
		MetadataRegistry.getHandler(type, controller, handlerName) as any
}

function makeResolver(options?: { logger?: ILogger; debugPipeline?: boolean }) {
	const componentManager = new ComponentManager(new Container(), liveMetadataRepository)
	return new ParameterResolver(componentManager, options?.logger, options?.debugPipeline)
}

describe('ParameterResolver', () => {
	test('resolves arguments and runs pipes in order', async () => {
		const resolver = makeResolver()
		const pipe1: IPipe = {
			transform(value) {
				return `p1:${String(value)}`
			}
		}
		const pipe2: IPipe = {
			transform(value) {
				return `p2:${String(value)}`
			}
		}

		const handlerParams: ParameterMetadata[] = [
			{
				index: 0,
				name: 'query',
				data: 'q',
				factory: async () => 'value-0'
			},
			{
				index: 2,
				name: 'param',
				data: 'id',
				factory: () => 'value-2'
			}
		]

		const args = await resolver.resolveArguments({
			controllerName: 'UsersController',
			handlerName: 'findOne',
			handlerArity: 1,
			handlerParams,
			handlerPipes: [pipe1, pipe2],
			context: {} as Context
		})

		expect(args).toHaveLength(3)
		expect(args[0]).toBe('p2:p1:value-0')
		expect(args[1]).toBe(undefined)
		expect(args[2]).toBe('p2:p1:value-2')
	})

	test('throws clear error for invalid factory metadata', async () => {
		const resolver = makeResolver()

		await expect(
			resolver.resolveArguments({
				controllerName: 'BrokenController',
				handlerName: 'index',
				handlerArity: 0,
				handlerParams: [
					{
						index: 0,
						name: 'body',
						factory: undefined as unknown as ParameterMetadata['factory']
					}
				],
				handlerPipes: [],
				context: {} as Context
			})
		).rejects.toThrow('Invalid parameter decorator metadata for BrokenController.index')
	})

	test('emits debug warning for sparse decorated indices', async () => {
		const events: LogEvent[] = []
		const logger: ILogger = {
			emit(event) {
				events.push(event)
			}
		}
		const resolver = makeResolver({ logger, debugPipeline: true })

		await resolver.resolveArguments({
			controllerName: 'SparseController',
			handlerName: 'findOne',
			handlerArity: 3,
			handlerParams: [
				{ index: 0, name: 'query', data: 'q', factory: async () => 'a' },
				{ index: 2, name: 'param', data: 'id', factory: async () => 'b' }
			],
			handlerPipes: [],
			context: {} as Context
		})

		expect(
			events.some(
				(event) =>
					event.level === 'warn' &&
					event.category === 'pipeline' &&
					event.message.includes('Potential parameter binding mismatch') &&
					(event.details as Record<string, unknown>).handlerArity === 3
			)
		).toBe(true)
	})

	test('emits debug warning when decorator index exceeds handler arity', async () => {
		const events: LogEvent[] = []
		const logger: ILogger = {
			emit(event) {
				events.push(event)
			}
		}
		const resolver = makeResolver({ logger, debugPipeline: true })

		await resolver.resolveArguments({
			controllerName: 'OutOfRangeController',
			handlerName: 'index',
			handlerArity: 1,
			handlerParams: [{ index: 2, name: 'query', data: 'q', factory: async () => 'a' }],
			handlerPipes: [],
			context: {} as Context
		})

		expect(
			events.some(
				(event) =>
					event.level === 'warn' &&
					event.category === 'pipeline' &&
					(event.details as Record<string, unknown>).maxDecoratorIndex === 2
			)
		).toBe(true)
	})
})
