/**
 * App-level registry where your application can publish and read pipeline data by key.
 * Available to bootstrap code, services, and any code with access to `app`.
 * Enables composition without hard coupling: producers and consumers use namespaced keys.
 */
export interface IApplicationContext {
	/**
	 * Get a value by key. Caller provides type for type safety.
	 * @param key - Namespaced registry key (e.g. 'app.config', 'openapi.spec')
	 * @returns The value or undefined if not set
	 */
	get<T>(key: string): T | undefined

	/**
	 * Set a value by key.
	 * @param key - Namespaced registry key
	 * @param value - Value to store
	 */
	set<T>(key: string, value: T): void

	/**
	 * Check if a key is present.
	 * @param key - Registry key
	 * @returns true if the key exists
	 */
	has(key: string): boolean

	/**
	 * Remove a key and its value.
	 * @param key - Registry key
	 * @returns true if the key existed and was removed
	 */
	delete(key: string): boolean

	/**
	 * Iterate over all registered keys.
	 */
	keys(): IterableIterator<string>
}
