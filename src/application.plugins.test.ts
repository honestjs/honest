import 'reflect-metadata'
import { afterEach, describe, expect, test } from 'bun:test'
import { MetadataRegistry } from './registries'
import { createEmptyModule, createTestController } from './testing/fixtures/application-test-fixtures'
import { createControllerTestApplication, createTestApplication } from './testing'

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

	test('plugin before/after constraints are respected deterministically', async () => {
		const order: string[] = []

		const ConfigPlugin = {
			beforeModulesRegistered: async () => {
				order.push('config:before')
			},
			afterModulesRegistered: async () => {
				order.push('config:after')
			}
		}

		const MetricsPlugin = {
			beforeModulesRegistered: async () => {
				order.push('metrics:before')
			},
			afterModulesRegistered: async () => {
				order.push('metrics:after')
			}
		}

		await createTestApplication({
			module: createEmptyModule(),
			appOptions: {
				plugins: [
					{ plugin: MetricsPlugin, name: 'metrics', after: ['config'] },
					{ plugin: ConfigPlugin, name: 'config' }
				]
			}
		})

		expect(order).toEqual(['config:before', 'metrics:before', 'config:after', 'metrics:after'])
	})

	test('plugin ordering fails fast when constraints reference unknown plugin', async () => {
		await expect(
			createTestApplication({
				module: createEmptyModule(),
				appOptions: {
					plugins: [{ plugin: {}, name: 'metrics', after: ['config'] }]
				}
			})
		).rejects.toThrow("declares after 'config'")
	})

	test('plugin capability contracts succeed when requirements are provided earlier', async () => {
		const docsPlugin = {
			meta: {
				name: 'docs',
				requires: ['artifact:routes'],
				provides: ['http:openapi']
			}
		}

		const artifactPlugin = {
			meta: {
				name: 'artifact',
				provides: ['artifact:routes']
			}
		}

		await expect(
			createTestApplication({
				module: createEmptyModule(),
				appOptions: {
					plugins: [
						{ plugin: docsPlugin, name: 'docs', after: ['artifact'] },
						{ plugin: artifactPlugin, name: 'artifact' }
					]
				}
			})
		).resolves.toBeDefined()
	})

	test('plugin capability contracts fail when required capability is missing', async () => {
		const docsPlugin = {
			meta: {
				name: 'docs',
				requires: ['artifact:routes']
			}
		}

		await expect(
			createTestApplication({
				module: createEmptyModule(),
				appOptions: {
					plugins: [{ plugin: docsPlugin, name: 'docs' }]
				}
			})
		).rejects.toThrow("requires 'artifact:routes'")
	})
})
