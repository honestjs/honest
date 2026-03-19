import { createTestApplication } from './create-test-application'
import type { CreateControllerTestApplicationOptions, TestApplication } from './testing.interface'

/**
 * Create a test application for a single controller with optional services/imports.
 */
export async function createControllerTestApplication(
	options: CreateControllerTestApplicationOptions
): Promise<TestApplication> {
	const { controller, ...rest } = options
	return createTestApplication({
		...rest,
		controllers: [controller]
	})
}
