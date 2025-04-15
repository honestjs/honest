import { createParamDecorator } from '../helpers'

/**
 * Decorator that binds the request body to a parameter
 * @param data - Optional property name to extract from the body
 */
export const Body = createParamDecorator('body', async (data, ctx) => {
	const body = await ctx.req.json()
	return data ? body[data] : body
})

/**
 * Decorator that binds a route parameter to a parameter
 * @param data - The parameter name in the route
 */
export const Param = createParamDecorator('param', (data, ctx) => {
	return data ? ctx.req.param(data) : ctx.req.param()
})

/**
 * Decorator that binds a query parameter to a parameter
 * @param data - The query parameter name
 */
export const Query = createParamDecorator('query', (data, ctx) => {
	return data ? ctx.req.query(data) : ctx.req.query()
})

/**
 * Decorator that binds a header value to a parameter
 * @param data - The header name
 */
export const Header = createParamDecorator('header', (data, ctx) => {
	return data ? ctx.req.header(data) : ctx.req.header()
})

/**
 * Decorator that binds the request object to a parameter
 */
export const Req = createParamDecorator('request', (_, ctx) => ctx.req)
export const Request = createParamDecorator('request', (_, ctx) => ctx.req)

/**
 * Decorator that binds the response object to a parameter
 */
export const Res = createParamDecorator('response', (_, ctx) => ctx.res)
export const Response = createParamDecorator('response', (_, ctx) => ctx.res)

/**
 * Decorator that binds the context object to a parameter
 */
export const Ctx = createParamDecorator('context', (_, ctx) => ctx)
export const Context = createParamDecorator('context', (_, ctx) => ctx)

/**
 * Decorator that binds a context variable to a parameter
 * @param data - The variable name to retrieve from context
 */
export const Var = createParamDecorator('variable', (data, ctx) => ctx.get(data))
export const Variable = createParamDecorator('variable', (data, ctx) => ctx.get(data))
