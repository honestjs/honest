# Interfaces

This directory contains TypeScript interfaces and type definitions that define the contracts and data structures used
throughout the Honest framework.

## Overview

Interfaces provide type safety and define the structure of objects, classes, and functions used in the framework. They
ensure consistency across components and provide clear contracts for framework extensions.

## Core Interfaces

### Application Configuration

#### `HonestOptions`

Main configuration interface for the Honest application:

```typescript
interface HonestOptions {
	container?: DiContainer
	hono?: {
		strict?: boolean
		router?: any
		getPath?: (request: Request, options?: any) => string
	}
	routing?: {
		prefix?: string
		version?: number | typeof VERSION_NEUTRAL | number[]
	}
	components?: {
		middleware?: MiddlewareType[]
		guards?: GuardType[]
		pipes?: PipeType[]
		filters?: FilterType[]
	}
	plugins?: PluginType[]
	onError?: (error: Error, context: Context) => Response | Promise<Response>
	notFound?: (context: Context) => Response | Promise<Response>
}
```

#### `ControllerOptions`

Configuration options for controllers:

```typescript
interface ControllerOptions {
	prefix?: string | null
	version?: number | null | typeof VERSION_NEUTRAL | number[]
}
```

#### `ModuleOptions`

Configuration options for modules:

```typescript
interface ModuleOptions {
	controllers?: Constructor[]
	services?: Constructor[]
	imports?: Constructor[]
}
```

### Dependency Injection

#### `DiContainer`

Interface for dependency injection containers:

```typescript
interface DiContainer {
	resolve<T>(target: Constructor<T>): T
	register<T>(target: Constructor<T>, instance: T): void
}
```

### Component Interfaces

#### `IMiddleware`

Interface for middleware components:

```typescript
interface IMiddleware {
	use(c: Context, next: Next): Promise<Response | void>
}
```

#### `IGuard`

Interface for guard components:

```typescript
interface IGuard {
	canActivate(context: Context): boolean | Promise<boolean>
}
```

#### `IPipe`

Interface for transformation pipes:

```typescript
interface IPipe {
	transform(value: unknown, metadata: ArgumentMetadata): Promise<unknown> | unknown
}
```

#### `IFilter`

Interface for exception filters:

```typescript
interface IFilter {
	catch(exception: Error, context: Context): Promise<Response | undefined> | Response | undefined
}
```

### Plugin System

#### `IPlugin`

Interface for framework plugins:

```typescript
interface IPlugin {
	beforeModulesRegistered?: (app: Application, hono: Hono) => void | Promise<void>
	afterModulesRegistered?: (app: Application, hono: Hono) => void | Promise<void>
}
```

### Routing

#### `RouteDefinition`

Internal metadata for route definitions:

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

#### `RouteInfo`

Public route information:

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

### Parameter Processing

#### `ParameterMetadata`

Metadata for route parameters:

```typescript
interface ParameterMetadata {
	index: number
	name: string
	data?: any
	factory: (data: any, ctx: Context) => any
	metatype?: Constructor<unknown>
}
```

#### `ArgumentMetadata`

Metadata for pipe transformations:

```typescript
interface ArgumentMetadata {
	type: 'body' | 'query' | 'param' | 'custom'
	metatype?: Constructor<unknown>
	data?: string
}
```

### Error Handling

#### `ErrorResponse`

Standardized error response structure:

```typescript
interface ErrorResponse {
	status: number
	message: string
	timestamp: string
	path: string
	requestId?: string
	code?: string
	details?: Record<string, any>
	errors?: Array<{ property: string; constraints: Record<string, string> }>
}
```

## Type Definitions

### Component Types

```typescript
type MiddlewareType = Constructor<IMiddleware> | IMiddleware
type GuardType = Constructor<IGuard> | IGuard
type PipeType = Constructor<IPipe> | IPipe
type FilterType = Constructor<IFilter> | IFilter
type PluginType = Constructor<IPlugin> | IPlugin
```

### HTTP Method Options

```typescript
interface HttpMethodOptions {
	prefix?: string | null
	version?: number | null | typeof VERSION_NEUTRAL | number[]
}
```

## Usage Examples

### Implementing a Custom Middleware

```typescript
import { IMiddleware } from '@honest/framework'

class LoggerMiddleware implements IMiddleware {
	async use(c: Context, next: Next): Promise<Response | void> {
		console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.path}`)
		return next()
	}
}
```

### Implementing a Custom Guard

```typescript
import { IGuard } from '@honest/framework'

class AuthGuard implements IGuard {
	async canActivate(context: Context): Promise<boolean> {
		const token = context.req.header('authorization')
		return !!token && this.validateToken(token)
	}

	private validateToken(token: string): boolean {
		// Token validation logic
		return true
	}
}
```

### Implementing a Custom Pipe

```typescript
import { IPipe, ArgumentMetadata } from '@honest/framework'

class ValidationPipe implements IPipe {
	transform(value: unknown, metadata: ArgumentMetadata): unknown {
		if (metadata.type === 'body' && metadata.metatype) {
			// Validation logic
			return this.validate(value, metadata.metatype)
		}
		return value
	}

	private validate(value: unknown, type: Constructor): unknown {
		// Validation implementation
		return value
	}
}
```

### Implementing a Custom Filter

```typescript
import { IFilter } from '@honest/framework'

class ValidationExceptionFilter implements IFilter {
	catch(exception: Error, context: Context): Response | undefined {
		if (exception.name === 'ValidationError') {
			return context.json(
				{
					status: 400,
					message: 'Validation failed',
					errors: exception.details
				},
				400
			)
		}
		return undefined // Let other filters handle it
	}
}
```

### Creating a Plugin

```typescript
import { IPlugin, Application } from '@honest/framework'

class LoggerPlugin implements IPlugin {
	async beforeModulesRegistered(app: Application, hono: Hono): Promise<void> {
		console.log('Setting up logging...')
		// Plugin setup logic
	}

	async afterModulesRegistered(app: Application, hono: Hono): Promise<void> {
		console.log('Logging setup complete')
		// Plugin cleanup logic
	}
}
```

### Application Configuration

```typescript
import { Application } from '@honest/framework'

const { app, hono } = await Application.create(AppModule, {
	container: customContainer,
	routing: {
		prefix: '/api',
		version: 1
	},
	components: {
		middleware: [LoggerMiddleware, CorsMiddleware],
		guards: [AuthGuard],
		pipes: [ValidationPipe],
		filters: [HttpExceptionFilter]
	},
	plugins: [LoggerPlugin],
	onError: (error, context) => {
		return context.json({ error: error.message }, 500)
	},
	notFound: (context) => {
		return context.json({ message: 'Not found' }, 404)
	}
})
```

## Best Practices

1. **Use interfaces for contracts** - Define clear contracts between components
2. **Extend existing interfaces** - Build upon framework interfaces when possible
3. **Maintain type safety** - Ensure all implementations satisfy their interfaces
4. **Document interfaces** - Provide clear documentation for custom interfaces
5. **Use generics appropriately** - Leverage TypeScript generics for flexible types
6. **Keep interfaces focused** - Each interface should have a single responsibility

## Framework Integration

Interfaces are used throughout the framework:

- **Type checking** - Ensures components implement required contracts
- **Plugin system** - Defines plugin lifecycle hooks
- **Component registration** - Validates component implementations
- **Error handling** - Standardizes error response formats
- **Route management** - Defines route metadata structures
- **Dependency injection** - Ensures container compatibility
