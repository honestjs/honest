import { createHttpMethodDecorator } from '../helpers'

/**
 * GET method decorator
 * The GET method requests a representation of the specified resource.
 * Requests using GET should only retrieve data and should not contain a request content.
 * @param path - The route path
 */
export const Get = createHttpMethodDecorator('get')

/**
 * POST method decorator
 * The POST method submits an entity to the specified resource,
 * often causing a change in state or side effects on the server.
 * @param path - The route path
 */
export const Post = createHttpMethodDecorator('post')

/**
 * PUT method decorator
 * The PUT method replaces all current representations of the target resource with the request content.
 * @param path - The route path
 */
export const Put = createHttpMethodDecorator('put')

/**
 * DELETE method decorator
 * The DELETE method deletes the specified resource.
 * @param path - The route path
 */
export const Delete = createHttpMethodDecorator('delete')

/**
 * PATCH method decorator
 * The PATCH method applies partial modifications to a resource.
 * @param path - The route path
 */
export const Patch = createHttpMethodDecorator('patch')

/**
 * OPTIONS method decorator
 * The OPTIONS method describes the communication options for the target resource.
 * @param path - The route path
 */
export const Options = createHttpMethodDecorator('options')

/**
 * ALL method decorator (matches all HTTP methods)
 * @param path - The route path
 */
export const All = createHttpMethodDecorator('all')
