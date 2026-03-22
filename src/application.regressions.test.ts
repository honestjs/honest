import 'reflect-metadata'
import { afterEach, describe, expect, test } from 'bun:test'
import { Application } from './application'
import { Controller, Get, Module, Service, UseFilters } from './decorators'
import type { IFilter, IGuard } from './interfaces'
import { MetadataRegistry } from './registries'
import { createOnlyAController, createOnlyBController } from './testing/fixtures/application-test-fixtures'
import { createControllerTestApplication } from './testing'

afterEach(() => {
	MetadataRegistry.clear()
})

describe('Application regressions', () => {
	test('global guards do not leak between sequential Application.create() calls', async () => {
		let guardCalled = false
		const LeakyGuard: IGuard = {
			canActivate() {
				guardCalled = true
				return false
			}
		}

		await createControllerTestApplication({
			controller: createOnlyAController(),
			appOptions: { components: { guards: [LeakyGuard] } }
		})

		expect(guardCalled).toBe(false)
		guardCalled = false

		const testApp = await createControllerTestApplication({ controller: createOnlyBController() })
		const res = await testApp.request('/only-b')

		expect(guardCalled).toBe(false)
		expect(res.status).toBe(200)
	})

	test('shared module imported by two parents is registered only once (deduplication)', async () => {
		@Service()
		class SharedService {
			value = Math.random()
		}

		@Controller('/shared')
		class SharedController {
			@Get()
			index() {
				return { ok: true }
			}
		}

		@Module({ controllers: [SharedController], services: [SharedService] })
		class SharedModule {}

		@Controller('/branch-a')
		class BranchAController {
			@Get()
			index() {
				return { branch: 'a' }
			}
		}

		@Module({ controllers: [BranchAController], imports: [SharedModule] })
		class BranchAModule {}

		@Controller('/branch-b')
		class BranchBController {
			@Get()
			index() {
				return { branch: 'b' }
			}
		}

		@Module({ controllers: [BranchBController], imports: [SharedModule] })
		class BranchBModule {}

		@Module({ imports: [BranchAModule, BranchBModule] })
		class DiamondRootModule {}

		const { app } = await Application.create(DiamondRootModule)
		const routes = app.getRoutes()
		const sharedRoutes = routes.filter((r) => r.fullPath.includes('/shared'))
		expect(sharedRoutes.length).toBe(1)
	})

	test('filter that throws returns a 500 instead of silently swallowing', async () => {
		const BrokenFilter: IFilter = {
			catch(): Response {
				throw new Error('filter exploded')
			}
		}

		@Controller('/filter-err')
		@UseFilters(BrokenFilter)
		class FilterErrorController {
			@Get()
			index() {
				throw new Error('original error')
			}
		}

		const testApp = await createControllerTestApplication({
			controller: FilterErrorController
		})
		const res = await testApp.request('/filter-err')

		expect(res.status).toBe(500)
		const body = await res.json()
		expect(body.message).toContain('filter exploded')
	})
})
