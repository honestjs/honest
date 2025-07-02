# Configuration in HonestJS

HonestJS applications can be configured through the `HonestOptions` interface when creating your application. This
allows you to customize various aspects of your application's behavior, from routing to error handling.

## Basic Configuration

The most basic way to configure your application is through the `Application.create()` method:

```typescript
import { Application } from 'honestjs'
import AppModule from './app.module'

const { hono } = await Application.create(AppModule, {
	// Configuration options go here
})
```

## Configuration Options

### Container Configuration

You can provide a custom dependency injection container:

```typescript
import { CustomContainer } from './custom-container'

const { hono } = await Application.create(AppModule, {
	container: new CustomContainer()
})
```

### Hono-specific Configuration

Configure the underlying Hono instance:

```typescript
const { hono } = await Application.create(AppModule, {
	hono: {
		// Whether to use strict matching for routes
		strict: true,
		// Custom router implementation
		router: customRouter,
		// Custom path extraction function
		getPath: (request, options) => {
			// Custom logic to extract path from request
			return request.url
		}
	}
})
```

### Routing Configuration

Set global routing options that apply to all routes:

```typescript
const { hono } = await Application.create(AppModule, {
	routing: {
		// Global API prefix (e.g., all routes become /api/*)
		prefix: 'api',
		// Global API version (e.g., all routes become /v1/*)
		version: 1
		// You can also use VERSION_NEUTRAL or an array of versions
		// version: VERSION_NEUTRAL  // Routes accessible with and without version
		// version: [1, 2]          // Routes available at both /v1/* and /v2/*
	}
})
```

**Example result:** With `prefix: 'api'` and `version: 1`, a route `@Get('/users')` becomes accessible at
`/api/v1/users`.

### Global Components Configuration

Apply components (middleware, guards, pipes, filters) globally to all routes:

```typescript
import { AuthGuard } from './guards/auth.guard'
import { LoggerMiddleware } from './middleware/logger.middleware'
import { ValidationPipe } from './pipes/validation.pipe'
import { HttpExceptionFilter } from './filters/http-exception.filter'

const { hono } = await Application.create(AppModule, {
	components: {
		// Global middleware applied to every route
		middleware: [
			new LoggerMiddleware(),
			// You can also pass classes, they will be instantiated
			SomeOtherMiddleware
		],
		// Global guards for authentication/authorization
		guards: [new AuthGuard()],
		// Global pipes for data transformation/validation
		pipes: [new ValidationPipe()],
		// Global exception filters for error handling
		filters: [new HttpExceptionFilter()]
	}
})
```

### Plugin Configuration

Extend your application with plugins:

```typescript
import { DatabasePlugin } from './plugins/database.plugin'
import { CachePlugin } from './plugins/cache.plugin'

const { hono } = await Application.create(AppModule, {
	plugins: [
		new DatabasePlugin(),
		new CachePlugin({
			ttl: 3600,
			maxSize: 1000
		})
	]
})
```

Plugins can hook into the application lifecycle with `beforeModulesRegistered` and `afterModulesRegistered` methods.

### Error Handling Configuration

Customize global error handling:

```typescript
const { hono } = await Application.create(AppModule, {
	// Custom error handler for unhandled exceptions
	onError: (error, context) => {
		console.error('Unhandled error:', error)
		return context.json(
			{
				error: 'Internal Server Error',
				message: 'Something went wrong'
			},
			500
		)
	},
	// Custom handler for routes that don't match any pattern
	notFound: (context) => {
		return context.json(
			{
				error: 'Not Found',
				message: `Route ${context.req.path} not found`
			},
			404
		)
	}
})
```

## Complete Configuration Example

Here's a comprehensive example showing all configuration options:

```typescript
import { Application, VERSION_NEUTRAL } from 'honestjs'
import { AuthGuard } from './guards/auth.guard'
import { LoggerMiddleware } from './middleware/logger.middleware'
import { ValidationPipe } from './pipes/validation.pipe'
import { HttpExceptionFilter } from './filters/http-exception.filter'
import { DatabasePlugin } from './plugins/database.plugin'
import AppModule from './app.module'

const { hono } = await Application.create(AppModule, {
	// Custom DI container
	container: new CustomContainer(),

	// Hono configuration
	hono: {
		strict: true
	},

	// Global routing configuration
	routing: {
		prefix: 'api',
		version: 1
	},

	// Global components
	components: {
		middleware: [new LoggerMiddleware()],
		guards: [new AuthGuard()],
		pipes: [new ValidationPipe()],
		filters: [new HttpExceptionFilter()]
	},

	// Plugins
	plugins: [new DatabasePlugin()],

	// Custom error handlers
	onError: (error, context) => {
		console.error('Error:', error)
		return context.json({ error: 'Internal Server Error' }, 500)
	},

	notFound: (context) => {
		return context.json({ error: 'Route not found' }, 404)
	}
})

export default hono
```

This configuration approach gives you fine-grained control over your application's behavior while maintaining clean and
organized code.
