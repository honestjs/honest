import 'reflect-metadata'
import { afterEach, describe, expect, test } from 'bun:test'
import { Application } from './application'
import type { DiagnosticEvent, IDiagnosticsEmitter } from './interfaces'
import { MetadataRegistry } from './registries'
import {
	createBrokenControllerModule,
	createDiagnosticsAController,
	createDiagnosticsBController,
	createEmptyModule,
	createTestController
} from './testing/fixtures/application-test-fixtures'
import { createControllerTestApplication, createTestApplication } from './testing'

afterEach(() => {
	MetadataRegistry.clear()
})

describe('Application diagnostics', () => {
	test('startup diagnostics includes route count in debug mode', async () => {
		const events: DiagnosticEvent[] = []
		const diagnostics: IDiagnosticsEmitter = {
			emit(event) {
				events.push(event)
			}
		}

		await createControllerTestApplication({
			controller: createTestController(),
			appOptions: {
				debug: true,
				diagnostics
			}
		})

		expect(
			events.some(
				(event) =>
					event.category === 'startup' &&
					event.level === 'info' &&
					event.message.includes('Application registered') &&
					Number((event.details as Record<string, unknown>)?.routeCount) >= 1
			)
		).toBe(true)
	})

	test('strict.requireRoutes emits startup diagnostic error before throwing', async () => {
		const events: DiagnosticEvent[] = []
		const diagnostics: IDiagnosticsEmitter = {
			emit(event) {
				events.push(event)
			}
		}

		await expect(
			Application.create(createEmptyModule(), {
				strict: { requireRoutes: true },
				diagnostics
			})
		).rejects.toThrow('Strict mode: no routes were registered')

		expect(
			events.some(
				(event) =>
					event.category === 'startup' &&
					event.level === 'error' &&
					event.message.includes('Strict mode failed')
			)
		).toBe(true)
	})

	test('startup diagnostics includes completion event with timing details', async () => {
		const events: DiagnosticEvent[] = []
		const diagnostics: IDiagnosticsEmitter = {
			emit(event) {
				events.push(event)
			}
		}

		await createControllerTestApplication({
			controller: createTestController(),
			appOptions: {
				debug: true,
				diagnostics
			}
		})

		const startupCompleted = events.find(
			(event) =>
				event.category === 'startup' &&
				event.level === 'info' &&
				event.message === 'Application startup completed'
		)

		expect(startupCompleted).toBeDefined()
		expect(
			Number((startupCompleted?.details as Record<string, unknown>)?.startupDurationMs)
		).toBeGreaterThanOrEqual(0)
		expect(Number((startupCompleted?.details as Record<string, unknown>)?.routeCount)).toBeGreaterThanOrEqual(1)
	})

	test('debug.startup enables startup diagnostics independently from debug.routes', async () => {
		const events: DiagnosticEvent[] = []
		const diagnostics: IDiagnosticsEmitter = {
			emit(event) {
				events.push(event)
			}
		}

		await createControllerTestApplication({
			controller: createTestController(),
			appOptions: {
				debug: { startup: true, routes: false },
				diagnostics
			}
		})

		expect(events.some((event) => event.category === 'startup')).toBe(true)
		expect(events.some((event) => event.category === 'routes')).toBe(false)
	})

	test('startup diagnostics emits generic startup failure event in debug mode', async () => {
		const events: DiagnosticEvent[] = []
		const diagnostics: IDiagnosticsEmitter = {
			emit(event) {
				events.push(event)
			}
		}

		await expect(Application.create(createBrokenControllerModule(), { debug: true, diagnostics })).rejects.toThrow(
			'is not decorated with @Controller()'
		)

		expect(
			events.some(
				(event) =>
					event.category === 'startup' &&
					event.level === 'error' &&
					event.message === 'Application startup failed' &&
					String((event.details as Record<string, unknown>)?.errorMessage || '').includes(
						'is not decorated with @Controller()'
					)
			)
		).toBe(true)
	})

	test('startupGuide emits actionable hints for strict no-routes startup failure', async () => {
		const events: DiagnosticEvent[] = []
		const diagnostics: IDiagnosticsEmitter = {
			emit(event) {
				events.push(event)
			}
		}

		await expect(
			Application.create(createEmptyModule(), {
				strict: { requireRoutes: true },
				startupGuide: true,
				diagnostics
			})
		).rejects.toThrow('Strict mode: no routes were registered')

		const guideEvent = events.find((event) => event.category === 'startup' && event.message === 'Startup guide')
		expect(guideEvent).toBeDefined()
		expect(Array.isArray((guideEvent?.details as Record<string, unknown>)?.hints)).toBe(true)
		expect(
			((guideEvent?.details as Record<string, unknown>)?.hints as string[]).some((hint) =>
				hint.includes('strict.requireRoutes')
			)
		).toBe(true)
	})

	test('startupGuide emits actionable hints for missing @Controller() startup failure', async () => {
		const events: DiagnosticEvent[] = []
		const diagnostics: IDiagnosticsEmitter = {
			emit(event) {
				events.push(event)
			}
		}

		await expect(
			Application.create(createBrokenControllerModule(), {
				startupGuide: { verbose: true },
				diagnostics
			})
		).rejects.toThrow('is not decorated with @Controller()')

		const guideEvent = events.find((event) => event.category === 'startup' && event.message === 'Startup guide')
		expect(guideEvent).toBeDefined()
		expect(
			((guideEvent?.details as Record<string, unknown>)?.hints as string[]).some((hint) =>
				hint.includes('@Controller()')
			)
		).toBe(true)

		expect(
			events.some(
				(event) =>
					event.category === 'startup' &&
					event.level === 'warn' &&
					event.message === 'Startup guide (verbose)'
			)
		).toBe(true)
	})

	test('debug.routes emits per-controller route registration timing diagnostics', async () => {
		const events: DiagnosticEvent[] = []
		const diagnostics: IDiagnosticsEmitter = {
			emit(event) {
				events.push(event)
			}
		}

		await createTestApplication({
			controllers: [createDiagnosticsAController(), createDiagnosticsBController()],
			appOptions: {
				debug: { routes: true, startup: false },
				diagnostics
			}
		})

		const controllerEvents = events.filter(
			(event) =>
				event.category === 'routes' &&
				event.level === 'info' &&
				event.message === 'Registered controller routes'
		)

		expect(controllerEvents.length).toBeGreaterThanOrEqual(2)
		expect(
			controllerEvents.every((event) => {
				const details = (event.details || {}) as Record<string, unknown>
				return (
					typeof details.controller === 'string' &&
					Number(details.routeCountAdded) >= 1 &&
					Number(details.registrationDurationMs) >= 0
				)
			})
		).toBe(true)
	})
})
