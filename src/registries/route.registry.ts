import type { RouteInfo } from '../interfaces'

/**
 * Registry for managing and querying route information in the application
 *
 * Provides functionality to:
 * - Register new routes with their metadata
 * - Query routes by various criteria (controller, method, path)
 * - Access route information for documentation and debugging
 * - Manage route lifecycle (registration and cleanup)
 *
 * The registry maintains a read-only view of routes to prevent unintended modifications
 */
export class RouteRegistry {
	/**
	 * Internal storage for registered routes
	 * Maintains the complete list of routes in registration order
	 */
	private static readonly routes: RouteInfo[] = []

	/**
	 * Registers a new route in the application
	 * @param routeInfo - Complete route information including path, method, and handler details
	 * @throws {Error} If the route information is invalid or incomplete
	 */
	static registerRoute(routeInfo: RouteInfo): void {
		this.routes.push(routeInfo)
	}

	/**
	 * Retrieves all registered routes in the application
	 * @returns A read-only array of all route information
	 * Routes are returned in their registration order
	 */
	static getRoutes(): ReadonlyArray<RouteInfo> {
		return this.routes
	}

	/**
	 * Retrieves all routes registered for a specific controller
	 * @param controllerName - Name or symbol identifying the controller
	 * @returns A read-only array of routes belonging to the specified controller
	 * Returns an empty array if no routes are found for the controller
	 */
	static getRoutesByController(controllerName: string | symbol): ReadonlyArray<RouteInfo> {
		return this.routes.filter((route) => route.controller === controllerName)
	}

	/**
	 * Retrieves all routes registered for a specific HTTP method
	 * @param method - HTTP method to filter by (case-insensitive)
	 * @returns A read-only array of routes handling the specified HTTP method
	 * Returns an empty array if no routes are found for the method
	 */
	static getRoutesByMethod(method: string): ReadonlyArray<RouteInfo> {
		return this.routes.filter((route) => route.method.toUpperCase() === method.toUpperCase())
	}

	/**
	 * Retrieves routes matching a specific path pattern
	 * @param pattern - Regular expression to match against route paths
	 * @returns A read-only array of routes whose paths match the pattern
	 * Returns an empty array if no matching routes are found
	 * @example
	 * ```ts
	 * // Find all routes containing 'users'
	 * const userRoutes = RouteRegistry.getRoutesByPath(/users/);
	 * ```
	 */
	static getRoutesByPath(pattern: RegExp): ReadonlyArray<RouteInfo> {
		return this.routes.filter((route) => pattern.test(route.fullPath))
	}

	/**
	 * Removes all registered routes from the registry
	 * Primarily used for testing and development purposes
	 * Use with caution in production environments
	 */
	static clear(): void {
		this.routes.length = 0
	}
}
