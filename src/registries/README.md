# Registries

This directory contains the metadata and route registration systems that store and manage framework metadata, including
decorator information, route definitions, and component registrations.

## Overview

Registries serve as the central storage and retrieval system for all framework metadata. They maintain decorator
information, route definitions, component registrations, and provide APIs for accessing this data throughout the
application lifecycle.

## Files

### `metadata.registry.ts`

The main metadata registry that stores all decorator and component information:

- **Route metadata** - Stores route definitions from HTTP method decorators
- **Controller metadata** - Stores controller paths and options
- **Service registration** - Tracks registered services for dependency injection
- **Module configuration** - Stores module options and dependencies
- **Parameter metadata** - Tracks parameter decorators and their configurations
- **Component registrations** - Manages global, controller, and handler-level components

### `route.registry.ts`

The route registry that provides public access to route information:

- **Route information** - Public API for accessing registered routes
- **Route queries** - Methods for filtering and searching routes
- **Route documentation** - Information useful for API documentation
- **Route debugging** - Tools for debugging route registration

### `index.ts`

Export file that provides access to all registries.

## Metadata Registry Features

### Route Metadata Storage

Stores route definitions collected from decorators:

```typescript
interface RouteDefinition {
	path: string
	method: string
	handlerName: string | symbol
	parameterMetadata: ParameterMetadata[]
	version?: number | null | typeof VERSION_NEUTRAL | number[]
	prefix?: string | null
}
```

**Usage:**

```typescript
// Automatically stored when using decorators
@Controller('users')
class UsersController {
	@Get(':id')
	getUser(@Param('id') id: string) {
		// Route metadata is automatically stored
	}
}
```

### Component Registration

Manages component registrations at different levels:

#### Global Components

Components applied to all routes:

```typescript
// Register global middleware
MetadataRegistry.registerGlobal('middleware', LoggerMiddleware)

// Register global guards
MetadataRegistry.registerGlobal('guard', AuthGuard)

// Register global pipes
MetadataRegistry.registerGlobal('pipe', ValidationPipe)

// Register global filters
MetadataRegistry.registerGlobal('filter', HttpExceptionFilter)
```

#### Controller Components

Components applied to specific controllers:

```typescript
// Register controller-level middleware
MetadataRegistry.registerController('middleware', UsersController, RateLimitMiddleware)

// Register controller-level guards
MetadataRegistry.registerController('guard', AdminController, AdminGuard)
```

#### Handler Components

Components applied to specific methods:

```typescript
// Register handler-level pipes
MetadataRegistry.registerHandler('pipe', 'UsersController:getUser', TransformPipe)

// Register handler-level filters
MetadataRegistry.registerHandler('filter', 'UsersController:createUser', ValidationFilter)
```

### Path-Scoped Components

Components applied to routes matching specific paths:

```typescript
// Register path-scoped middleware
MetadataRegistry.registerGlobalWithPath('middleware', {
	path: '/api',
	component: ApiMiddleware
})

// Register path-scoped guards
MetadataRegistry.registerGlobalWithPath('guard', {
	path: '/admin',
	component: AdminGuard
})
```

### Service Registration

Tracks services for dependency injection:

```typescript
// Register a service
MetadataRegistry.addService(UserService)

// Check if a class is a service
const isService = MetadataRegistry.isService(UserService)

// Get all registered services
const services = MetadataRegistry.getAllServices()
```

### Module Configuration

Stores module options and dependencies:

```typescript
// Store module options
MetadataRegistry.setModuleOptions(AppModule, {
	controllers: [UsersController],
	services: [UserService],
	imports: [AuthModule]
})

// Retrieve module options
const options = MetadataRegistry.getModuleOptions(AppModule)
```

## Route Registry Features

### Route Information Storage

Stores public route information for documentation and debugging:

```typescript
interface RouteInfo {
	controller: string | symbol
	handler: string | symbol
	method: string
	prefix: string
	version?: string
	route: string
	path: string
	fullPath: string
	parameters: ParameterMetadata[]
}
```

### Route Queries

Provides methods for querying and filtering routes:

```typescript
// Get all routes
const allRoutes = RouteRegistry.getRoutes()

// Get routes by controller
const userRoutes = RouteRegistry.getRoutesByController('UsersController')

// Get routes by HTTP method
const getRoutes = RouteRegistry.getRoutesByMethod('GET')

// Get routes by path pattern
const apiRoutes = RouteRegistry.getRoutesByPath(/^\/api\//)
```

### Route Registration

Registers routes during the application setup:

```typescript
// Automatically called by the route manager
RouteRegistry.registerRoute({
	controller: 'UsersController',
	handler: 'getUser',
	method: 'GET',
	prefix: '/api',
	version: '/v1',
	route: '/users',
	path: '/:id',
	fullPath: '/api/v1/users/:id',
	parameters: [
		{
			index: 0,
			name: 'param',
			data: 'id',
			factory: (data, ctx) => ctx.req.param(data),
			metatype: String
		}
	]
})
```

## Usage Examples

### Accessing Route Information

```typescript
import { Application } from '@honest/framework'

const { app, hono } = await Application.create(AppModule)

// Get all registered routes
const routes = app.getRoutes()
console.log(
	'Registered routes:',
	routes.map((r) => r.fullPath)
)

// Get routes for documentation
const apiRoutes = routes.filter((r) => r.prefix === '/api')
const v1Routes = routes.filter((r) => r.version === '/v1')
```

### Custom Route Analysis

```typescript
// Analyze route patterns
const routes = RouteRegistry.getRoutes()

// Find routes with parameters
const parameterizedRoutes = routes.filter((r) => r.parameters.some((p) => p.name === 'param'))

// Find routes by HTTP method
const postRoutes = RouteRegistry.getRoutesByMethod('POST')

// Find routes matching a pattern
const adminRoutes = RouteRegistry.getRoutesByPath(/\/admin\//)
```

### Component Registration

```typescript
// Register custom components
MetadataRegistry.registerGlobal('middleware', CustomMiddleware)
MetadataRegistry.registerController('guard', AdminController, AdminGuard)
MetadataRegistry.registerHandler('pipe', 'UsersController:createUser', ValidationPipe)

// Register path-scoped components
MetadataRegistry.registerGlobalWithPath('middleware', {
	path: '/api/v1',
	component: V1Middleware
})
```

### Service Management

```typescript
// Register services
MetadataRegistry.addService(UserService)
MetadataRegistry.addService(PostService)

// Check service registration
if (MetadataRegistry.isService(UserService)) {
	console.log('UserService is registered')
}

// Get all services
const services = Array.from(MetadataRegistry.getAllServices())
console.log(
	'Registered services:',
	services.map((s) => s.name)
)
```

## Best Practices

1. **Use registry APIs** - Access metadata through registry methods rather than direct access
2. **Register components appropriately** - Use the correct level (global, controller, handler) for components
3. **Leverage route queries** - Use route registry methods for filtering and analysis
4. **Maintain consistency** - Ensure metadata is consistent across the application
5. **Use path scoping** - Apply components only where needed for better performance
6. **Document routes** - Use route information for API documentation generation

## Framework Integration

Registries are central to the framework architecture:

- **Decorator system** - Stores metadata from all decorators
- **Route management** - Provides route information for registration
- **Component system** - Manages component registrations and retrieval
- **Dependency injection** - Tracks service registrations
- **Module system** - Stores module configurations
- **Plugin system** - Allows plugins to access and modify metadata

## Performance Considerations

- **Efficient storage** - Uses Maps and Sets for fast lookups
- **Lazy loading** - Metadata is loaded only when needed
- **Memory management** - Automatic cleanup of unused metadata
- **Cached queries** - Route queries are optimized for performance
- **Minimal reflection** - Uses efficient reflection metadata access
