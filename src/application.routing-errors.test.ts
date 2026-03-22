import 'reflect-metadata'
import { afterEach, describe, expect, test } from 'bun:test'
import { Application } from './application'
import type { DiagnosticEvent, IDiagnosticsEmitter } from './interfaces'
import { MetadataRegistry } from './registries'
import {
	createBrokenControllerModule,
	createDuplicateRouteControllers,
	createEmptyModule,
	createUndecoratedController
} from './testing/fixtures/application-test-fixtures'
import { createTestApplication } from './testing'

afterEach(() => {
	MetadataRegistry.clear()
})

describe('Application routing errors', () => {
	test('fails with clear message for controllers missing @Controller()', async () => {
		await expect(createTestApplication({ controllers: [createUndecoratedController()] })).rejects.toThrow(
			'is not decorated with @Controller()'
		)
	})

	test('strict.requireRoutes fails startup when no routes are registered', async () => {
		await expect(Application.create(createEmptyModule(), { strict: { requireRoutes: true } })).rejects.toThrow(
			'Strict mode: no routes were registered'
		)
	})

	test('fails startup on duplicate method/path routes', async () => {
		const { a, b } = createDuplicateRouteControllers()
		await expect(createTestApplication({ controllers: [a, b] })).rejects.toThrow('Duplicate route detected')
	})

	test('debug.routes emits per-controller failure diagnostics when registration throws', async () => {
		const events: DiagnosticEvent[] = []
		const diagnostics: IDiagnosticsEmitter = {
			emit(event) {
				events.push(event)
			}
		}

		await expect(
			Application.create(createBrokenControllerModule(), {
				debug: { routes: true, startup: false },
				diagnostics
			})
		).rejects.toThrow('is not decorated with @Controller()')

		expect(
			events.some(
				(event) =>
					event.category === 'routes' &&
					event.level === 'error' &&
					event.message === 'Failed to register controller routes' &&
					String((event.details as Record<string, unknown>)?.errorMessage || '').includes(
						'is not decorated with @Controller()'
					)
			)
		).toBe(true)
	})
})
