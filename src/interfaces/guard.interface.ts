import type { Constructor } from '../types'

import type { Context } from 'hono'

/**
 * Interface defining a guard.
 * Guards determine whether a request should be handled by the route handler or not.
 */
export interface IGuard {
	/**
	 * Method to implement the guard logic.
	 * Return true to allow the request to proceed, false to deny.
	 *
	 * @param context - The Hono context object
	 * @returns A boolean or Promise<boolean> indicating if the request is allowed
	 */
	canActivate(context: Context): boolean | Promise<boolean>
}

/**
 * Type for guard classes
 * Can be either a constructor of IGuard or an instance of IGuard
 */
export type GuardType = Constructor<IGuard> | IGuard
