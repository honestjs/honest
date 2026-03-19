import type { Constructor } from '../types'

/**
 * Contract for checking whether classes are registered as injectable services.
 */
export interface IServiceRegistry {
	isService(service: Constructor): boolean
}
