# Routing in HonestJS

Routing is the mechanism that maps incoming requests to the correct controller methods. HonestJS uses a combination of
decorators on your controller classes and methods to define the routes for your application.

## Controllers

Controllers are responsible for handling incoming requests and returning responses. To create a controller, you use the
`@Controller()` decorator on a class.

The `@Controller()` decorator can take an optional route prefix. This prefix will be applied to all routes defined
within that controller.

**Example:**

```typescript
// src/modules/users/users.controller.ts
import { Controller, Get } from 'honestjs'

@Controller('/users')
export class UsersController {
	@Get()
	findAll() {
		return 'This route handles GET requests to /users'
	}

	@Get('/:id')
	findOne() {
		return 'This route handles GET requests to /users/:id'
	}
}
```

In this example, the `@Controller('/users')` decorator sets a base path for all routes in `UsersController`.

## HTTP Method Decorators

To handle specific HTTP methods, HonestJS provides decorators for all standard methods:

- `@Get(path?: string)`
- `@Post(path?: string)`
- `@Put(path?: string)`
- `@Delete(path?: string)`
- `@Patch(path?: string)`
- `@Options(path?: string)`
- `@All(path?: string)`

These decorators are used on methods within a controller. They can take an optional path segment that will be appended
to the controller's prefix.

```typescript
// src/modules/users/users.controller.ts
import { Controller, Get, Post } from 'honestjs'
import UsersService from './users.service'

@Controller('/users')
class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Post()
	async createUser(@Body() body: CreateUserDto): Promise<User> {
		return await this.usersService.create(body)
	}

	@Get()
	async getUsers(): Promise<User[]> {
		return await this.usersService.findAll()
	}
}
```

- The `createUser` method will be triggered by a `POST` request to `/users`.
- The `getUsers` method will be triggered by a `GET` request to `/users`.

## Route Parameters

You can capture dynamic values from the URL path using route parameters. To define a route parameter, use a colon (`:`)
in the path. To access its value, use the `@Param()` decorator in the method signature.

```typescript
// src/modules/users/users.controller.ts
import { Controller, Get, Param } from 'honestjs'

@Controller('/users')
class UsersController {
	//...
	@Get('/:id')
	async getUser(@Param('id') id: number): Promise<User> {
		const user = await this.usersService.findById(Number(id))
		if (!user) {
			throw new NotFoundException('User not found')
		}
		return user
	}
	//...
}
```

In this case, a `GET` request to `/users/123` will call the `getUser` method, and the value of `id` will be `123`.

## Route Versioning

HonestJS supports API versioning. You can set a global version, a version per controller, or even a version per route.

### Global Versioning

You can set a global version prefix when creating your application.

```typescript
// src/main.ts
const { hono } = await Application.create(AppModule, {
	routing: {
		version: 1
	}
})
```

With this configuration, all routes will be prefixed with `/v1`. For example, `GET /users` becomes `GET /v1/users`.

### Controller-level Versioning

You can override the global version or set a specific version for a controller.

```typescript
@Controller('/users', { version: 2 })
export class UsersController {
	// Routes in this controller will be prefixed with /v2
}
```

You can also opt-out of versioning for a specific controller, even if a global version is set.

```typescript
@Controller('/health', { version: null })
export class HealthController {
	// This controller's routes will not have a version prefix
}
```

### Route-level Versioning

You can also specify a version directly on a route decorator, which will override any controller or global settings.

```typescript
@Controller('/users')
export class UsersController {
	@Get('/legacy', { version: 1 })
	getLegacyUsers() {
		// This will be accessible at /v1/users/legacy
	}

	@Get('/new', { version: 2 })
	getNewUsers() {
		// This will be accessible at /v2/users/new
	}
}
```

### Version-Neutral Routes

Sometimes you may want certain routes to be accessible both with and without version prefixes. For this, you can use the
`VERSION_NEUTRAL` symbol.

```typescript
import { Controller, Get, VERSION_NEUTRAL } from 'honestjs'

@Controller('/health')
export class HealthController {
	@Get('/status', { version: VERSION_NEUTRAL })
	getStatus() {
		// This route will be accessible at both:
		// - /health/status (without version)
		// - /v1/health/status (with version, if global version is set)
		return { status: 'ok' }
	}
}
```

Version-neutral routes are particularly useful for:

- Health check endpoints
- Status endpoints
- Public API endpoints that should remain accessible regardless of versioning
- Utility endpoints that don't change between API versions

By combining these features, you can build well-structured and maintainable routing for your applications.
