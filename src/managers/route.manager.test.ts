import 'reflect-metadata'
import { afterEach, describe, expect, test } from 'bun:test'
import { MetadataRegistry } from '../registries'
import { Controller, Get, Post } from '../decorators'
import { VERSION_NEUTRAL } from '../constants'
import { createTestApplication } from '../testing'

afterEach(() => {
	MetadataRegistry.clear()
})

describe('RouteManager', () => {
	describe('global prefix', () => {
		test('applied correctly', async () => {
			@Controller('/users')
			class UsersCtrl {
				@Get()
				list() {
					return { users: [] }
				}
			}

			const testApp = await createTestApplication({
				controllers: [UsersCtrl],
				appOptions: { routing: { prefix: '/api' } }
			})

			const res = await testApp.request('/api/users')
			expect(res.status).toBe(200)
		})
	})

	describe('versioning', () => {
		test('numeric version creates /v{N} prefix', async () => {
			@Controller('/items')
			class ItemsCtrl {
				@Get()
				list() {
					return { items: [] }
				}
			}

			const testApp = await createTestApplication({
				controllers: [ItemsCtrl],
				appOptions: { routing: { version: 1 } }
			})

			const res = await testApp.request('/v1/items')
			expect(res.status).toBe(200)
		})

		test('VERSION_NEUTRAL skips version prefix', async () => {
			@Controller('/neutral')
			class NeutralCtrl {
				@Get()
				index() {
					return { ok: true }
				}
			}

			const testApp = await createTestApplication({
				controllers: [NeutralCtrl],
				appOptions: { routing: { version: VERSION_NEUTRAL } }
			})

			const res = await testApp.request('/neutral')
			expect(res.status).toBe(200)
		})

		test('controller-level version override', async () => {
			@Controller('/override', { version: 2 })
			class OverrideCtrl {
				@Get()
				index() {
					return { v: 2 }
				}
			}

			const testApp = await createTestApplication({
				controllers: [OverrideCtrl],
				appOptions: { routing: { version: 1 } }
			})

			const res = await testApp.request('/v2/override')
			expect(res.status).toBe(200)
		})
	})

	describe('error cases', () => {
		test('undecorated controller throws', async () => {
			class BadCtrl {
				list() {
					return {}
				}
			}

			await expect(createTestApplication({ controllers: [BadCtrl] })).rejects.toThrow(
				'not decorated with @Controller()'
			)
		})

		test('controller with no routes throws', async () => {
			@Controller('/empty')
			class EmptyCtrl {}

			await expect(createTestApplication({ controllers: [EmptyCtrl] })).rejects.toThrow('has no route handlers')
		})
	})

	describe('route registration', () => {
		test('registers routes with correct full path', async () => {
			@Controller('/cats')
			class CatsCtrl {
				@Get('/all')
				getAll() {
					return { cats: [] }
				}

				@Post()
				create() {
					return { created: true }
				}
			}

			const testApp = await createTestApplication({ controllers: [CatsCtrl] })
			const routes = testApp.app.getRoutes()
			expect(routes.some((r) => r.fullPath === '/cats/all' && r.method === 'get')).toBe(true)
			expect(routes.some((r) => r.fullPath === '/cats' && r.method === 'post')).toBe(true)

			const res = await testApp.request('/cats/all')
			expect(res.status).toBe(200)
		})
	})
})
