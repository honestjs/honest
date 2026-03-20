import { Application } from '../application'
import type { Constructor } from '../types'
import { createTestingModule } from './create-testing-module'
import type { CreateTestApplicationOptions, TestApplication } from './testing.interface'

/**
 * Create a test-friendly application instance with a convenience request helper.
 */
export async function createTestApplication(options: CreateTestApplicationOptions = {}): Promise<TestApplication> {
	const { module, appOptions, ...moduleOptions } = options
	const rootModule = (module ?? createTestingModule(moduleOptions)) as Constructor
	const { app, hono } = await Application.create(rootModule, appOptions)

	const request = (input: string | Request, init?: RequestInit): Promise<Response> => {
		if (typeof input === 'string') {
			const normalizedInput =
				input.startsWith('http://') || input.startsWith('https://')
					? input
					: `http://localhost${input.startsWith('/') ? input : `/${input}`}`
			return Promise.resolve(hono.request(normalizedInput, init))
		}

		return Promise.resolve(hono.request(input))
	}

	return { app, hono, request }
}
