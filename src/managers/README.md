# Managers

This directory contains the core framework managers that handle component lifecycle, route registration, and application
orchestration.

## Overview

Managers are responsible for coordinating the different parts of the framework, including component registration, route
management, dependency resolution, and application initialization.

## Files

### `component.manager.ts`

The main component manager that handles all framework components:

- **Component registration** - Registers middleware, guards, pipes, and filters
- **Dependency resolution** - Resolves component instances from the DI container
- **Component execution** - Manages the execution order of components
- **Global component setup** - Configures application-wide components
- **Module registration** - Handles module dependencies and service registration
- **Exception handling** - Manages exception filters and error processing

### `route.manager.ts`

The route manager responsible for route registration and handling:

- **Route registration** - Registers controller routes with the Hono application
- **Version management** - Handles API versioning and route versioning
- **Path construction** - Builds complete route paths with prefixes and versions
- **Middleware application** - Applies middleware to routes
- **Parameter processing** - Handles parameter binding and transformation
- **Guard validation** - Executes guards before route handlers

### `index.ts`

Export file that provides access to all managers.

## Component Manager Features

### Component Types

The component manager handles four main types of components:

1. **Middleware** - Request/response processing
2. **Guards** - Authorization and access control
3. **Pipes** - Data transformation and validation
4. **Filters** - Exception handling

### Component Resolution

Automatically resolves component classes to instances:

```typescript
// Class-based component
class AuthGuard implements IGuard {
	canActivate(context: Context): boolean {
		// Guard logic
	}
}

// Instance-based component
const loggerMiddleware = {
	use: async (c: Context, next: Next) => {
		console.log(`${c.req.method} ${c.req.path}`)
		return next()
	}
}

// Both are automatically resolved and used
@UseGuards(AuthGuard)
@UseMiddleware(loggerMiddleware)
@Controller('users')
class UsersController {}
```

### Component Hierarchy

Components are applied in a specific order:

1. **Global components** - Applied to all routes
2. **Controller components** - Applied to all routes in a controller
3. **Handler components** - Applied to specific route handlers

### Module Registration

Handles the registration of modules and their dependencies:

```typescript
@Module({
	imports: [AuthModule, DatabaseModule],
	controllers: [UsersController, PostsController],
	services: [UserService, PostService]
})
class AppModule {}

// ComponentManager.registerModule handles:
// 1. Recursive import registration
// 2. Service instantiation
// 3. Controller collection
```

### Exception Handling

Manages exception filters in a hierarchical manner:

```typescript
// Exception handling order:
// 1. Handler-level filters
// 2. Controller-level filters
// 3. Global filters
// 4. Default error response

class CustomExceptionFilter implements IFilter {
	catch(exception: Error, context: Context): Response | undefined {
		if (exception.name === 'ValidationError') {
			return context.json({ error: 'Validation failed' }, 400)
		}
		return undefined // Let other filters handle it
	}
}
```

## Route Manager Features

### Route Registration Process

The route manager follows a comprehensive registration process:

1. **Controller resolution** - Resolves controller instance with dependencies
2. **Metadata extraction** - Gets route definitions and parameter metadata
3. **Path construction** - Builds complete paths with prefix, version, controller, and method
4. **Component application** - Applies middleware, guards, and pipes
5. **Handler wrapping** - Wraps handlers with error handling and parameter processing
6. **Route registration** - Registers routes with the Hono application

### Version Management

Supports flexible API versioning:

```typescript
// Global version
const { app, hono } = await Application.create(AppModule, {
	routing: { version: 1 } // All routes get /v1 prefix
})

// Controller-specific version
@Controller('users', { version: 2 }) // Overrides global version
class UsersController {}

// Method-specific version
@Controller('users')
class UsersController {
	@Get('profile', { version: 3 }) // Overrides controller version
	getProfile() {}
}

// Version neutral (accessible with and without version)
@Controller('health', { version: VERSION_NEUTRAL })
class HealthController {}

// Multiple versions
@Controller('users', { version: [1, 2] })
class UsersController {}
```

### Path Construction

Builds complete route paths in the correct order:

```
prefix + version + controller-path + method-path
```

Examples:

- `/api/v1/users/profile` (prefix: /api, version: 1, controller: users, method: profile)
- `/v2/admin/users` (version: 2, controller: admin/users)
- `/health` (no prefix, no version, controller: health)

### Parameter Processing

Handles parameter binding and transformation:

```typescript
@Controller('users')
class UsersController {
	@Get(':id')
	getUser(@Param('id') id: string, @Query('include') include: string, @Body() userData: UserDto) {
		// Parameters are automatically bound and transformed
	}
}
```

## Usage Examples

### Global Component Setup

```typescript
import { Application } from '@honest/framework'

const { app, hono } = await Application.create(AppModule, {
	components: {
		middleware: [LoggerMiddleware, CorsMiddleware],
		guards: [AuthGuard],
		pipes: [ValidationPipe],
		filters: [HttpExceptionFilter]
	}
})
```

### Custom Route Registration

```typescript
// The route manager automatically handles this
@Controller('users', { prefix: 'api', version: 1 })
class UsersController {
	@Get(':id', { version: 2 })
	getUser(@Param('id') id: string) {
		return { id, name: 'John' }
	}
}

// Results in routes:
// GET /api/v1/users/:id (controller version)
// GET /api/v2/users/:id (method version)
```

### Exception Filter Setup

```typescript
@Controller('users')
@UseFilters(ValidationExceptionFilter)
class UsersController {
	@UseFilters(CustomExceptionFilter)
	@Post()
	createUser(@Body() user: UserDto) {
		// If an exception occurs, CustomExceptionFilter is tried first,
		// then ValidationExceptionFilter, then global filters
	}
}
```

### Component Resolution

```typescript
// The ComponentManager automatically resolves components
class LoggerMiddleware implements IMiddleware {
	use(c: Context, next: Next): Promise<Response | void> {
		console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.path}`)
		return next()
	}
}

// Both class and instance are supported
@UseMiddleware(LoggerMiddleware) // Class - will be instantiated
@UseMiddleware(new LoggerMiddleware()) // Instance - used directly
@Controller('users')
class UsersController {}
```

## Best Practices

1. **Use component hierarchy** - Apply components at the appropriate level
2. **Leverage global components** - Set up application-wide middleware and guards
3. **Plan versioning strategy** - Use consistent versioning across related endpoints
4. **Optimize component order** - Place frequently used components at higher levels
5. **Handle errors gracefully** - Use filters for consistent error handling
6. **Use type safety** - Leverage ComponentType and ComponentTypeMap for type-safe operations

## Framework Integration

Managers are central to the framework architecture:

- **Application initialization** - Managers handle the setup process
- **Component lifecycle** - Coordinate component registration and execution
- **Route processing** - Manage the complete request lifecycle
- **Dependency management** - Work with the DI container for service resolution
- **Plugin system** - Allow plugins to extend manager functionality
- **Error handling** - Provide centralized error processing

## Performance Considerations

- **Lazy component resolution** - Components are resolved only when needed
- **Efficient path matching** - Optimized path construction and matching
- **Cached metadata** - Route metadata is cached for better performance
- **Minimal reflection** - Uses efficient reflection metadata access
- **Memory management** - Automatic cleanup of unused references
- **Exception filter optimization** - Filters are executed in order until one handles the exception
