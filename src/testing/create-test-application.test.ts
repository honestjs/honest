import 'reflect-metadata'
import { afterEach, describe, expect, test } from 'bun:test'
import { Controller, Get } from '../decorators'
import { createControllerTestApplication } from './create-controller-test-application'
import { createTestApplication } from './create-test-application'
import { createServiceTestContainer } from './create-service-test-container'
import { createTestingModule } from './create-testing-module'
import { MetadataRegistry } from '../registries'

function createHelperController() {
	@Controller('/helper')
	class HelperController {
		@Get()
		index() {
			return { ok: true }
		}
	}
	return HelperController
}

class CounterService {
	public count = 0

	increment() {
		this.count += 1
		return this.count
	}
}

class MockedCounterService extends CounterService {
	increment() {
		return 999
	}
}

afterEach(() => {
	MetadataRegistry.clear()
})

describe('testing harness', () => {
	test('createTestingModule registers module metadata with provided options', () => {
		const TestModule = createTestingModule({
			name: 'HarnessModule',
			controllers: [],
			services: [],
			imports: []
		})

		const options = MetadataRegistry.getModuleOptions(TestModule)
		expect(options).toBeDefined()
		expect(options?.controllers).toEqual([])
		expect(options?.services).toEqual([])
		expect(options?.imports).toEqual([])
	})

	test('createTestApplication passes app options through to Application.create', async () => {
		await expect(
			createTestApplication({
				appOptions: {
					strict: { requireRoutes: true }
				}
			})
		).rejects.toThrow('Strict mode: no routes were registered')
	})

	test('createTestApplication request helper supports relative path input', async () => {
		const testApp = await createTestApplication()
		const response = await testApp.request('/missing')

		expect(response.status).toBe(404)
	})

	test('createTestApplication request helper supports Request input', async () => {
		const testApp = await createTestApplication()
		const response = await testApp.request(new Request('http://localhost/missing'))

		expect(response.status).toBe(404)
	})

	test('createControllerTestApplication mounts a single controller', async () => {
		const testApp = await createControllerTestApplication({
			controller: createHelperController()
		})

		const response = await testApp.request('/helper')
		expect(response.status).toBe(200)
		expect(await response.json()).toEqual({ ok: true })
	})

	test('createControllerTestApplication passes appOptions through', async () => {
		await expect(
			createControllerTestApplication({
				controller: createHelperController(),
				appOptions: {
					routing: {
						prefix: 'api'
					}
				}
			})
		).resolves.toBeDefined()

		const testApp = await createControllerTestApplication({
			controller: createHelperController(),
			appOptions: {
				routing: {
					prefix: 'api'
				}
			}
		})

		const response = await testApp.request('/api/helper')
		expect(response.status).toBe(200)
	})

	test('createServiceTestContainer resolves and caches services', () => {
		const harness = createServiceTestContainer()
		const service = harness.get(CounterService)

		expect(service.increment()).toBe(1)
		expect(harness.has(CounterService)).toBe(true)
		expect(harness.get(CounterService)).toBe(service)
	})

	test('createServiceTestContainer applies overrides before resolve', () => {
		const mock = new MockedCounterService()
		const harness = createServiceTestContainer({
			overrides: [{ provide: CounterService, useValue: mock }]
		})

		expect(harness.get(CounterService)).toBe(mock)
		expect(harness.get(CounterService).increment()).toBe(999)
	})

	test('createServiceTestContainer preloads services', () => {
		const harness = createServiceTestContainer({ preload: [CounterService] })
		expect(harness.has(CounterService)).toBe(true)
	})
})
