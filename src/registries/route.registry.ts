import type { RouteInfo } from '../interfaces'

/**
 * Registry for managing and querying route information in the application.
 *
 * Each Application instance owns its own RouteRegistry, ensuring routes
 * from one app never leak into another.
 */
export class RouteRegistry {
	private readonly routes: RouteInfo[] = []

	registerRoute(routeInfo: RouteInfo): void {
		if (!routeInfo) {
			throw new Error('Route info is required')
		}

		if (!routeInfo.controller) {
			throw new Error('Route controller is required')
		}

		if (!routeInfo.handler) {
			throw new Error('Route handler is required')
		}

		if (!routeInfo.method) {
			throw new Error('Route method is required')
		}

		if (!routeInfo.fullPath) {
			throw new Error('Route fullPath is required')
		}

		const isDuplicate = this.routes.some(
			(route) =>
				route.fullPath === routeInfo.fullPath && route.method.toUpperCase() === routeInfo.method.toUpperCase()
		)
		if (isDuplicate) {
			throw new Error(
				`Duplicate route detected: ${routeInfo.method.toUpperCase()} ${routeInfo.fullPath} (${String(routeInfo.controller)}.${String(routeInfo.handler)})`
			)
		}

		this.routes.push(routeInfo)
	}

	getRoutes(): ReadonlyArray<RouteInfo> {
		return this.routes
	}

	getRoutesByController(controllerName: string | symbol): ReadonlyArray<RouteInfo> {
		return this.routes.filter((route) => route.controller === controllerName)
	}

	getRoutesByMethod(method: string): ReadonlyArray<RouteInfo> {
		return this.routes.filter((route) => route.method.toUpperCase() === method.toUpperCase())
	}

	getRoutesByPath(pattern: RegExp): ReadonlyArray<RouteInfo> {
		return this.routes.filter((route) => pattern.test(route.fullPath))
	}

	clear(): void {
		this.routes.length = 0
	}
}
