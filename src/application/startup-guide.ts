import type { HonestOptions, ILogger } from '../interfaces'
import type { Constructor } from '../types'

export function createStartupGuideHints(errorMessage: string): string[] {
	const hints = new Set<string>()

	hints.add('Check module wiring: root module imports, controllers, and services should be registered correctly.')

	if (errorMessage.includes('not decorated with @Controller()')) {
		hints.add('Add @Controller() to the class or remove it from module.controllers.')
	}

	if (errorMessage.includes('has no route handlers')) {
		hints.add('Add at least one HTTP method decorator such as @Get() or @Post() in the controller.')
	}

	if (errorMessage.includes('not decorated with @Service()')) {
		hints.add('Add @Service() to injectable classes used in constructor dependencies.')
	}

	if (errorMessage.includes('constructor metadata is missing') || errorMessage.includes('reflect-metadata')) {
		hints.add("Import 'reflect-metadata' in your entry file and enable 'emitDecoratorMetadata' in tsconfig.")
	}

	if (errorMessage.includes('Strict mode: no routes were registered')) {
		hints.add('Disable strict.requireRoutes for empty modules, or add a controller with at least one route.')
	}

	return [...hints]
}

export function emitStartupGuide(
	logger: ILogger,
	startupGuide: HonestOptions['startupGuide'],
	error: unknown,
	rootModule: Constructor
): void {
	if (!startupGuide) {
		return
	}

	const verbose = typeof startupGuide === 'object' && Boolean(startupGuide.verbose)
	const errorMessage = error instanceof Error ? error.message : String(error)
	const hints = createStartupGuideHints(errorMessage)

	logger.emit({
		level: 'warn',
		category: 'startup',
		message: 'Startup guide',
		details: {
			rootModule: rootModule.name,
			errorMessage,
			hints,
			verbose
		}
	})

	if (verbose) {
		logger.emit({
			level: 'warn',
			category: 'startup',
			message: 'Startup guide (verbose)',
			details: {
				steps: [
					'Verify decorators are present for controllers/services used by DI and routing.',
					"Ensure 'reflect-metadata' is imported once at entry and 'emitDecoratorMetadata' is enabled.",
					'Enable debug.startup for extra startup diagnostics and timing details.'
				]
			}
		})
	}
}
