import 'reflect-metadata'
import { afterEach, describe, expect, test } from 'bun:test'
import { MetadataRegistry } from './registries'
import { createTestController } from './testing/fixtures/application-test-fixtures'
import { createControllerTestApplication } from './testing'

afterEach(() => {
	MetadataRegistry.clear()
})

describe('Application plugins', () => {
	test('plain plugin without processors still works', async () => {
		const order: string[] = []
		const TestPlugin = {
			beforeModulesRegistered: async () => {
				order.push('before')
			},
			afterModulesRegistered: async () => {
				order.push('after')
			}
		}
		await createControllerTestApplication({
			controller: createTestController(),
			appOptions: { plugins: [TestPlugin] }
		})
		expect(order).toEqual(['before', 'after'])
	})

	test('plugin with preProcessors and postProcessors runs in correct order', async () => {
		const order: string[] = []
		const TestPlugin = {
			beforeModulesRegistered: async () => {
				order.push('before')
			},
			afterModulesRegistered: async () => {
				order.push('after')
			}
		}
		const pre1 = async (_app: unknown, _hono: unknown, ctx: { set: (k: string, v: string) => void }) => {
			order.push('pre1')
			ctx.set('plugin.order', 'pre1')
		}
		const pre2 = async () => {
			order.push('pre2')
		}
		const post1 = async (_app: unknown, _hono: unknown, ctx: { get: (k: string) => unknown }) => {
			order.push('post1')
			expect(ctx.get('plugin.order')).toBe('pre1')
		}
		await createControllerTestApplication({
			controller: createTestController(),
			appOptions: {
				plugins: [
					{
						plugin: TestPlugin,
						preProcessors: [pre1, pre2],
						postProcessors: [post1]
					}
				]
			}
		})
		expect(order).toEqual(['pre1', 'pre2', 'before', 'after', 'post1'])
	})
})
