import type { ControllerOptions, ModuleOptions } from '../interfaces'
import type { Constructor } from '../types'
import { Controller } from './controller.decorator'
import { Get } from './http-method.decorator'
import { Module } from './module.decorator'

/**
 * Decorator that marks a class as a controller
 * Controllers are responsible for handling incoming requests and returning responses
 * @param route - The base route for all endpoints in this controller
 * @param options - Configuration options for the controller
 * @returns A class decorator function
 */
export function View(
	route = '',
	options: ControllerOptions = {
		prefix: null,
		version: null
	}
): ClassDecorator {
	return Controller(route, options)
}

/**
 * GET method decorator
 * The GET method requests a representation of the specified resource.
 * Requests using GET should only retrieve data and should not contain a request content.
 * @param path - The route path
 */
export const Page = Get

/**
 * Decorator that marks a class as a module
 * Modules are used to organize the application structure and dependencies
 * @param options - Configuration options for the module
 * @returns A class decorator function
 */
export function MvcModule(options: ModuleOptions & { views?: Constructor[] } = {}) {
	return Module({
		imports: options.imports,
		services: options.services,
		controllers: (options.views || []).concat(options.controllers || [])
	})
}
