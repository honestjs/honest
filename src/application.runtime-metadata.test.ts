import 'reflect-metadata'
import { afterEach, describe, expect, test } from 'bun:test'
import type { IFilter } from './interfaces'
import { MetadataRegistry } from './registries'
import { createRuntimeMetadataController } from './testing/fixtures/application-test-fixtures'
import { createControllerTestApplication } from './testing'

afterEach(() => {
	MetadataRegistry.clear()
})

describe('Application runtime metadata', () => {
	test('metadata changes after app creation do not affect running app behavior', async () => {
		const RuntimeMetadataController = createRuntimeMetadataController()
		const testApp = await createControllerTestApplication({
			controller: RuntimeMetadataController
		})

		const InjectedFilter: IFilter = {
			catch(_exception: Error, context: any): Response {
				return context.json({ injected: true }, 418)
			}
		}

		MetadataRegistry.registerHandler('filter', 'RuntimeMetadataController:index', InjectedFilter)

		const res = await testApp.request('/runtime-metadata')
		expect(res.status).toBe(500)
		const body = await res.json()
		expect(body.message).toContain('runtime metadata baseline error')
		expect(body.injected).toBeUndefined()
	})
})
