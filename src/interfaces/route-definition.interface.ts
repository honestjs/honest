import type { VERSION_NEUTRAL } from '../constants'
import type { ParameterMetadata } from '../interfaces'

/**
 * Internal metadata for defining a route. This interface is used by the framework
 * to store route information collected from decorators.
 *
 * @example
 * ```typescript
 * // Internal representation of:
 * @Controller('users')
 * class UsersController {
 *   @Get(':id')
 *   getUser(@Param('id') id: string) {}
 * }
 * ```
 */
export interface RouteDefinition {
	/**
	 * Route path relative to the controller's base path.
	 * Supports path parameters using colon syntax.
	 *
	 * @example ':id' | 'users/:userId/posts/:postId' | ''
	 */
	path: string
	/**
	 * HTTP method for the route (GET, POST, PUT, DELETE, etc.)
	 */
	method: string
	/**
	 * Name of the method in the controller class that handles this route
	 */
	handlerName: string | symbol
	/**
	 * Metadata about the parameters of the handler method,
	 * including decorators like @Body(), @Param(), @Query(), etc.
	 */
	parameterMetadata: ParameterMetadata[]
	/**
	 * Route-specific API version, overrides controller and global version.
	 *
	 * @example
	 * ```typescript
	 * version: 1              // -> /v1/...
	 * version: null          // -> /... (no version)
	 * version: VERSION_NEUTRAL // -> Both /... and /v1/...
	 * version: [1, 2]       // -> Both /v1/... and /v2/...
	 * ```
	 */
	version?: number | null | typeof VERSION_NEUTRAL | number[]
	/**
	 * Route-specific prefix that overrides controller and global prefix.
	 * Set to null to explicitly remove any prefix.
	 *
	 * @example 'api' | 'v2/api' | null
	 */
	prefix?: string | null
}
