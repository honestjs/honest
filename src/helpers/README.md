# Helpers

This directory contains utility functions and helper methods that support the core functionality of the Honest
framework.

## Overview

Helpers provide reusable utility functions for common tasks like creating decorators, handling errors, and processing
parameters. They encapsulate complex logic and provide clean, reusable abstractions.

## Files

### `create-error-response.helper.ts`

Helper function for creating standardized error responses:

- **Consistent error formatting** - Ensures all errors follow the same response structure
- **HTTP exception handling** - Proper handling of Hono's HTTPException
- **Environment-aware details** - Different error information for development vs production
- **Request context integration** - Includes path, timestamp, and request ID

### `create-http-method-decorator.helper.ts`

Factory function for creating HTTP method decorators:

- **Decorator generation** - Creates decorators for GET, POST, PUT, DELETE, etc.
- **Metadata registration** - Automatically registers route metadata
- **Options support** - Handles version and prefix options for routes
- **Type safety** - Provides full TypeScript support

### `create-param-decorator.helper.ts`

Factory function for creating parameter decorators:

- **Parameter binding** - Creates decorators for @Body, @Param, @Query, etc.
- **Metadata tracking** - Registers parameter metadata for processing
- **Type information** - Captures parameter types for validation
- **Context integration** - Handles Hono context parameter binding

### `index.ts`

Export file that provides access to all helper functions.

## Helper Functions

### createErrorResponse

Creates standardized error response objects:

```typescript
function createErrorResponse(
	exception: Error,
	context: Context,
	options?: {
		status?: number
		title?: string
		detail?: string
		code?: string
		additionalDetails?: Record<string, any>
	}
): { response: ErrorResponse; status: ContentfulStatusCode }
```

**Usage:**

```typescript
import { createErrorResponse } from '@honest/framework'

// In an exception filter
catch(exception: Error, context: Context) {
  const { response, status } = createErrorResponse(exception, context, {
    code: 'VALIDATION_ERROR',
    detail: 'Invalid user data provided'
  })

  return context.json(response, status)
}
```

### createHttpMethodDecorator

Creates HTTP method decorators with metadata registration:

```typescript
function createHttpMethodDecorator(method: string) {
	return (path = '', options: HttpMethodOptions = {}): MethodDecorator => {
		// Creates decorators like @Get, @Post, @Put, etc.
	}
}
```

**Usage:**

```typescript
// This is how the framework creates HTTP method decorators
const Get = createHttpMethodDecorator('get')
const Post = createHttpMethodDecorator('post')
const Put = createHttpMethodDecorator('put')
const Delete = createHttpMethodDecorator('delete')
```

### createParamDecorator

Creates parameter decorators with metadata tracking:

```typescript
function createParamDecorator<T = any>(type: string, factory?: (data: any, ctx: Context) => T) {
	return (data?: any) => {
		// Creates decorators like @Body, @Param, @Query, etc.
	}
}
```

**Usage:**

```typescript
// This is how the framework creates parameter decorators
export const Body = createParamDecorator('body', async (data, ctx) => {
	const body = await ctx.req.json()
	return data ? body[data] : body
})

export const Param = createParamDecorator('param', (data, ctx) => {
	return data ? ctx.req.param(data) : ctx.req.param()
})
```

## Usage Examples

### Custom Error Response

```typescript
import { createErrorResponse } from '@honest/framework'

class CustomExceptionFilter {
	catch(exception: Error, context: Context) {
		const { response, status } = createErrorResponse(exception, context, {
			title: 'Custom Error Message',
			code: 'CUSTOM_ERROR',
			additionalDetails: {
				customField: 'Additional information'
			}
		})

		return context.json(response, status)
	}
}
```

### Custom Parameter Decorator

```typescript
import { createParamDecorator } from '@honest/framework'

// Create a custom decorator for extracting user from JWT
export const CurrentUser = createParamDecorator('user', (data, ctx) => {
	const token = ctx.req.header('authorization')?.replace('Bearer ', '')
	if (!token) return null

	// Decode JWT and return user
	return decodeJWT(token)
})

// Usage in controller
@Controller('users')
class UsersController {
	@Get('profile')
	getProfile(@CurrentUser() user: User) {
		return user
	}
}
```

### Custom HTTP Method Decorator

```typescript
import { createHttpMethodDecorator } from '@honest/framework'

// Create a custom decorator for API endpoints
const ApiGet = createHttpMethodDecorator('get')

// Usage with custom options
@Controller('api')
class ApiController {
	@ApiGet('data', { version: 2 })
	getData() {
		return { data: 'v2 data' }
	}
}
```

## Error Response Structure

The `createErrorResponse` helper creates responses with this structure:

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

## Parameter Metadata

The `createParamDecorator` helper tracks parameter metadata:

```typescript
interface ParameterMetadata {
	index: number
	name: string
	data?: any
	factory: (data: any, ctx: Context) => any
	metatype?: Constructor<unknown>
}
```

## Best Practices

1. **Use helper functions** - Leverage existing helpers instead of duplicating logic
2. **Maintain consistency** - Use standardized error responses across the application
3. **Type safety** - Ensure custom decorators maintain TypeScript type safety
4. **Error handling** - Always handle errors gracefully with proper context
5. **Documentation** - Document custom helpers and their usage patterns

## Framework Integration

Helpers are used throughout the framework:

- **Decorator system** - All decorators are created using helper functions
- **Error handling** - Standardized error responses across all components
- **Parameter processing** - Consistent parameter binding and validation
- **Metadata management** - Centralized metadata registration and retrieval
- **Plugin system** - Plugins can use helpers for custom functionality

## Customization

### Creating Custom Helpers

```typescript
// Custom helper for API versioning
export function createVersionedDecorator(version: number) {
	return (path: string, options: HttpMethodOptions = {}) => {
		return createHttpMethodDecorator('get')(path, {
			...options,
			version
		})
	}
}

// Usage
const V1Get = createVersionedDecorator(1)
const V2Get = createVersionedDecorator(2)

@Controller('api')
class ApiController {
	@V1Get('users') // -> /v1/api/users
	getUsersV1() {}

	@V2Get('users') // -> /v2/api/users
	getUsersV2() {}
}
```
