import { describe, expect, test } from 'bun:test'
import type { Context } from 'hono'
import { Container } from '../di'
import type { ParameterMetadata } from '../interfaces'
import type { IPipe } from '../interfaces'
import { ComponentManager } from './component.manager'
import { ParameterResolver } from './parameter.resolver'

function makeResolver() {
	const componentManager = new ComponentManager(new Container())
	return new ParameterResolver(componentManager)
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
})
