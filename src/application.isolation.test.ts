import 'reflect-metadata'
import { afterEach, describe, expect, test } from 'bun:test'
import { Controller, Get, Service } from './decorators'
import type { IFilter } from './interfaces'
import { MetadataRegistry } from './registries'
import { createOnlyAController, createOnlyBController } from './testing/fixtures/application-test-fixtures'
import { createControllerTestApplication } from './testing'

afterEach(() => {
	MetadataRegistry.clear()
})

describe('Application isolation', () => {
	test('two apps created in sequence have fully isolated routes', async () => {
		const appA = await createControllerTestApplication({ controller: createOnlyAController() })
		const appB = await createControllerTestApplication({ controller: createOnlyBController() })

		expect(appA.app.getRoutes().length).toBe(1)
		expect(appB.app.getRoutes().length).toBe(1)
		expect(appA.app.getRoutes()[0].fullPath).toContain('/only-a')
		expect(appB.app.getRoutes()[0].fullPath).toContain('/only-b')

		const resA = await appA.request('/only-a')
		expect(resA.status).toBe(200)
		expect(await resA.json()).toEqual({ app: 'a' })

		const resB = await appB.request('/only-b')
		expect(resB.status).toBe(200)
		expect(await resB.json()).toEqual({ app: 'b' })
	})

	test('global filters are isolated between apps', async () => {
		let filterHitCount = 0
		const CountingFilter: IFilter = {
			catch(_exception: any, context: any): Response {
				filterHitCount++
				return context.json({ filtered: true }, 500)
			}
		}

		@Controller('/err')
		class ErrController {
			@Get()
			index() {
				throw new Error('boom')
			}
		}

		const app1 = await createControllerTestApplication({
			controller: ErrController,
			appOptions: { components: { filters: [CountingFilter] } }
		})
		await app1.request('/err')
		expect(filterHitCount).toBe(1)

		filterHitCount = 0
		const app2 = await createControllerTestApplication({ controller: ErrController })
		const res = await app2.request('/err')
		expect(filterHitCount).toBe(0)
		expect(res.status).toBe(500)
	})

	test('DI containers are isolated between apps', async () => {
		@Service()
		class CounterService {
			count = 0
		}

		@Controller('/counter')
		class CounterController {
			constructor(private svc: CounterService) {}
			@Get()
			index() {
				this.svc.count++
				return { count: this.svc.count }
			}
		}

		const app1 = await createControllerTestApplication({
			controller: CounterController,
			services: [CounterService]
		})
		await app1.request('/counter')
		const res1 = await app1.request('/counter')
		expect((await res1.json()).count).toBe(2)

		const app2 = await createControllerTestApplication({
			controller: CounterController,
			services: [CounterService]
		})
		const res2 = await app2.request('/counter')
		expect((await res2.json()).count).toBe(1)
	})
})
