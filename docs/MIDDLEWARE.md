# Middleware in HonestJS

Middleware are functions that are executed before the route handler. They can perform a wide range of tasks, such as
logging, authentication, request parsing, and more. HonestJS provides a flexible middleware system that allows you to
apply middleware at different levels: global, controller, and handler.

## Creating Middleware

A middleware is a class that implements the `IMiddleware` interface, which has a single `use` method. This method
receives the Hono `Context` and a `next` function.

**Example:** A simple logger middleware.

```typescript
import type { IMiddleware } from 'honestjs'
import type { Context, Next } from 'hono'

export class LoggerMiddleware implements IMiddleware {
	async use(c: Context, next: Next) {
		console.log(`[${c.req.method}] ${c.req.url} - Request received`)
		await next()
		console.log(`Response status: ${c.res.status}`)
	}
}
```

## Applying Middleware

You can apply middleware using the `@UseMiddleware()` decorator or by configuring it globally when you create the
application.

### Global Middleware

Global middleware are applied to every route in your application. They are useful for cross-cutting concerns like
logging, security headers, or request ID generation.

You can register global middleware in the `Application.create` options.

**Example:**

`src/main.ts`

```typescript
import { Application } from 'honestjs'
import { LoggerMiddleware } from './middleware/logger.middleware'

const { hono } = await Application.create(AppModule, {
	components: {
		middleware: [new LoggerMiddleware()]
	}
})
```

### Controller-level Middleware

You can apply middleware to all routes within a specific controller by using the `@UseMiddleware()` decorator on the
controller class.

**Example:**

```typescript
import { Controller } from 'honestjs'
import { UseMiddleware } from 'honestjs'
import { AuthenticationMiddleware } from './middleware/auth.middleware'

@Controller('/profile')
@UseMiddleware(AuthenticationMiddleware)
export class ProfileController {
	// All routes in this controller will be protected by the AuthenticationMiddleware
}
```

### Handler-level Middleware

You can also apply middleware to a specific route handler. This is useful when a middleware is only needed for one or a
few routes.

**Example:**

```typescript
import { Controller, Get, UseMiddleware } from 'honestjs'
import { SpecificTaskMiddleware } from './middleware/specific-task.middleware'

@Controller('/tasks')
export class TasksController {
	@Get('/:id')
	@UseMiddleware(SpecificTaskMiddleware)
	getTask() {
		// This route is the only one that uses the SpecificTaskMiddleware
	}
}
```

## Execution Order

Middleware are executed in the following order:

1. Global Middleware
2. Controller-level Middleware
3. Handler-level Middleware

## Using Hono Middleware

HonestJS is built on Hono, so you can use any existing Hono middleware. The `_templates/mvc` example shows how to
integrate Hono's `jsxRenderer` and a custom `EmojiFavicon` middleware.

To use a Hono middleware, you can create a simple wrapper class.

```typescript
// A wrapper to use Hono's jsxRenderer with HonestJS
import { jsxRenderer } from 'hono/jsx-renderer'
import { IMiddleware } from 'honestjs'

export class HonoMiddleware implements IMiddleware {
	constructor(private middleware: any) {}

	use(c: Context, next: Next) {
		return this.middleware(c, next)
	}
}

// In main.ts
const { hono } = await Application.create(AppModule, {
	components: {
		middleware: [new HonoMiddleware(jsxRenderer(MainLayout))]
	}
})
```

This approach allows you to seamlessly integrate the rich ecosystem of Hono middleware into your HonestJS application.
