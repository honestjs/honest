import type { VERSION_NEUTRAL } from '../constants'

/**
 * Options for HTTP method decorators (@Get, @Post, @Put, @Delete, etc.)
 *
 * @example
 * ```typescript
 * @Get('users', { prefix: 'api', version: 2 })
 * getUsers() {
 *   // ...
 * }
 * ```
 */
export interface HttpMethodOptions {
	/**
	 * Optional prefix for this specific route, overrides controller and global prefix.
	 * Set to null to explicitly remove any prefix for this route.
	 *
	 * @example
	 * ```typescript
	 * @Get('users', { prefix: 'api' })     // -> /api/users
	 * @Get('users', { prefix: null })      // -> /users (no prefix)
	 * @Get('users', { prefix: 'v2/api' })  // -> /v2/api/users
	 * ```
	 */
	prefix?: string | null

	/**
	 * API version for this specific route, overrides controller and global version.
	 *
	 * @example
	 * ```typescript
	 * @Get('users', { version: 1 })           // -> /v1/users
	 * @Get('users', { version: null })        // -> /users (no version)
	 * @Get('users', { version: VERSION_NEUTRAL }) // -> Both /users and /v1/users
	 * @Get('users', { version: [1, 2] })     // -> Both /v1/users and /v2/users
	 * ```
	 */
	version?: number | null | typeof VERSION_NEUTRAL | number[]
}
