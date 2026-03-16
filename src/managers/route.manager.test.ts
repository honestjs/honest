import 'reflect-metadata'
import { afterEach, describe, expect, test } from 'bun:test'
import { MetadataRegistry } from '../registries'
import { Controller, Get, Post, Module } from '../decorators'
import { VERSION_NEUTRAL } from '../constants'
import { Application } from '../application'

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

			@Module({ controllers: [UsersCtrl] })
			class AppMod {}

			const { hono } = await Application.create(AppMod, { routing: { prefix: '/api' } })
			const res = await hono.request(new Request('http://localhost/api/users'))
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

			@Module({ controllers: [ItemsCtrl] })
			class AppMod {}

			const { hono } = await Application.create(AppMod, { routing: { version: 1 } })
			const res = await hono.request(new Request('http://localhost/v1/items'))
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

			@Module({ controllers: [NeutralCtrl] })
			class AppMod {}

			const { hono } = await Application.create(AppMod, { routing: { version: VERSION_NEUTRAL } })
			const res = await hono.request(new Request('http://localhost/neutral'))
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

			@Module({ controllers: [OverrideCtrl] })
			class AppMod {}

			const { hono } = await Application.create(AppMod, { routing: { version: 1 } })
			const res = await hono.request(new Request('http://localhost/v2/override'))
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

			@Module({ controllers: [BadCtrl] })
			class AppMod {}

			await expect(Application.create(AppMod)).rejects.toThrow('not decorated with @Controller()')
		})

		test('controller with no routes throws', async () => {
			@Controller('/empty')
			class EmptyCtrl {}

			@Module({ controllers: [EmptyCtrl] })
			class AppMod {}

			await expect(Application.create(AppMod)).rejects.toThrow('has no route handlers')
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

			@Module({ controllers: [CatsCtrl] })
			class AppMod {}

			const { hono, app } = await Application.create(AppMod)
			const routes = app.getRoutes()
			expect(routes.some((r) => r.fullPath === '/cats/all' && r.method === 'get')).toBe(true)
			expect(routes.some((r) => r.fullPath === '/cats' && r.method === 'post')).toBe(true)

			const res = await hono.request(new Request('http://localhost/cats/all'))
			expect(res.status).toBe(200)
		})
	})
})
