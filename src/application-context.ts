import type { IApplicationContext } from './interfaces'

/**
 * Map-backed implementation of the app-level registry.
 * Used by Application so the app (bootstrap, services, any code with `app`) can share pipeline data by key.
 */
export class ApplicationContext implements IApplicationContext {
	private readonly store = new Map<string, unknown>()

	get<T>(key: string): T | undefined {
		return this.store.get(key) as T | undefined
	}

	set<T>(key: string, value: T): void {
		this.store.set(key, value)
	}

	has(key: string): boolean {
		return this.store.has(key)
	}

	delete(key: string): boolean {
		return this.store.delete(key)
	}

	keys(): IterableIterator<string> {
		return this.store.keys()
	}
}
