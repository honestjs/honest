# Parameter Decorators in HonestJS

Parameter decorators allow you to extract data from the incoming request and inject it directly into your route
handler's parameters. This provides a clean and declarative way to access request data.

## Built-in Parameter Decorators

HonestJS comes with a set of built-in decorators for common use cases:

- `@Body(data?: string)`: Extracts the request body. Can optionally extract a specific property from the body.
- `@Param(data?: string)`: Extracts route parameters.
- `@Query(data?: string)`: Extracts query parameters.
- `@Header(data?: string)`: Extracts request headers.
- `@Req()` or `@Request()`: Injects the entire Hono request object.
- `@Res()` or `@Response()`: Injects the Hono response object. (Note: In Hono, you typically return a response rather
  than directly manipulating the `res` object).
- `@Ctx()` or `@Context()`: Injects the Hono `Context` object.
- `@Var(data: string)` or `@Variable(data: string)`: Extracts a variable from the context (e.g., set by a middleware).

**Example:** Using various decorators.

```typescript
import { Body, Controller, Ctx, Get, Param, Post, Query } from 'honestjs'
import { Context } from 'hono'
import { CreateUserDto } from './dtos/create-user.dto'

@Controller('/users')
export class UsersController {
	@Post()
	createUser(@Body() createUserDto: CreateUserDto) {
		return this.usersService.create(createUserDto)
	}

	@Get('/:id')
	findUserById(@Param('id') id: string) {
		return `User ID: ${id}`
	}

	@Get()
	findAllUsers(@Query('role') role: string) {
		return `Finding all users with role: ${role || 'any'}`
	}

	@Get('/context')
	getContext(@Ctx() context: Context) {
		// Access the full Hono context
		return `Request path: ${context.req.path}`
	}
}
```

## Creating Custom Parameter Decorators

You can create your own custom parameter decorators using the `createParamDecorator` helper function. This is useful for
abstracting away complex logic for extracting data from the request.

The `createParamDecorator` function takes a `type` string and a `factory` function. The factory function receives the
`data` passed to the decorator and the Hono `Context`.

**Example:** A custom decorator to extract the client's IP address. This example is taken from the `_templates/mvc`
project.

`src/decorators/parameter.decorator.ts`

```typescript
import { createParamDecorator } from 'honestjs'
import { Context } from 'hono'

export const ClientIP = createParamDecorator('ip', (_, ctx: Context) => {
	const forwardedFor = ctx.req.header('x-forwarded-for')
	const realIP = ctx.req.header('x-real-ip')
	const cfIP = ctx.req.header('cf-connecting-ip')

	const ip = forwardedFor?.split(',')[0].trim() || realIP || cfIP || 'unknown'

	return ip
})
```

**How to use the custom decorator:**

Now you can use the `@ClientIP()` decorator in your route handlers.

```typescript
import { Controller, Get } from 'honestjs'
import { ClientIP } from '../decorators/parameter.decorator'

@Controller()
export class AppController {
	@Get('/ip')
	getIpAddress(@ClientIP() ip: string) {
		return `Your IP address is: ${ip}`
	}
}
```

This approach keeps your route handlers clean and readable, while encapsulating the logic for extracting data in
reusable decorators.
