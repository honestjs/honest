# Handlers

This directory contains request processing utilities and error handling components for the Honest framework.

## Overview

Handlers provide standardized ways to process requests and handle errors across the application. They ensure consistent
error responses and proper request handling patterns.

## Files

### `error.handler.ts`

The main error handler that provides consistent error response formatting:

- **Standardized error responses** - Consistent error format across the application
- **HTTP exception handling** - Proper handling of Hono's HTTPException
- **Environment-aware responses** - Different error details for development vs production
- **Request context integration** - Includes request path, timestamp, and request ID

### `not-found.handler.ts`

Handler for 404 Not Found responses:

- **Consistent 404 responses** - Standardized format for missing routes
- **Request path inclusion** - Shows which path was not found
- **JSON response format** - Consistent with other error responses

### `index.ts`

Export file that provides access to all handlers.

## Error Handler Features

### Standardized Error Response

The error handler creates consistent error responses with:

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

### HTTP Exception Support

Automatically handles Hono's HTTPException with proper status codes:

```typescript
import { HTTPException } from 'hono/http-exception'

@Controller('users')
class UsersController {
	@Get(':id')
	getUser(@Param('id') id: string) {
		if (!id) {
			throw new HTTPException(400, { message: 'User ID is required' })
		}
		// ...
	}
}
```

### Environment-Aware Responses

Provides different error details based on the environment:

```typescript
// Development environment
{
  "status": 500,
  "message": "Database connection failed",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/api/users",
  "details": {
    "stack": "Error: Connection refused..."
  }
}

// Production environment
{
  "status": 500,
  "message": "Internal Server Error",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/api/users"
}
```

## Usage Examples

### Basic Error Handling

```typescript
import { Application } from '@honest/framework'

const { app, hono } = await Application.create(AppModule, {
	onError: (error, context) => {
		// Custom error handling logic
		return context.json({
			error: error.message,
			timestamp: new Date().toISOString()
		})
	}
})
```

### Custom Not Found Handler

```typescript
import { Application } from '@honest/framework'

const { app, hono } = await Application.create(AppModule, {
	notFound: (context) => {
		return context.json(
			{
				message: 'Route not found',
				path: context.req.path,
				suggestions: ['/api/users', '/api/posts']
			},
			404
		)
	}
})
```

### Controller-Level Error Handling

```typescript
@Controller('users')
@UseFilters(CustomExceptionFilter)
class UsersController {
	@Get(':id')
	getUser(@Param('id') id: string) {
		if (!id) {
			throw new Error('User ID is required')
		}
		// ...
	}
}
```

## Error Response Format

### Success Response

```json
{
	"users": [
		{ "id": 1, "name": "John" },
		{ "id": 2, "name": "Jane" }
	]
}
```

### Error Response

```json
{
	"status": 400,
	"message": "User ID is required",
	"timestamp": "2024-01-01T12:00:00.000Z",
	"path": "/api/users",
	"requestId": "req-123",
	"code": "VALIDATION_ERROR",
	"details": {
		"field": "id",
		"constraint": "required"
	}
}
```

### Not Found Response

```json
{
	"message": "Not Found - /api/nonexistent",
	"status": 404
}
```

## Best Practices

1. **Use HTTP exceptions** - Throw HTTPException for HTTP-specific errors
2. **Provide meaningful messages** - Give users actionable error information
3. **Include request context** - Add path, timestamp, and request ID for debugging
4. **Environment-appropriate details** - Show stack traces only in development
5. **Consistent error codes** - Use standardized error codes across the application
6. **Handle all error types** - Ensure all exceptions are properly caught and formatted

## Framework Integration

Error handlers are integrated throughout the framework:

- **Global error handling** - Applied to all routes automatically
- **Controller-level filters** - Allow custom error handling per controller
- **Method-level filters** - Provide granular error handling for specific endpoints
- **Plugin system** - Plugins can extend error handling functionality
- **Middleware integration** - Error handling works with all middleware

## Customization Options

### Custom Error Handler

```typescript
class CustomErrorHandler {
	static handle() {
		return async (error: Error, context: Context) => {
			// Custom error processing logic
			const response = {
				error: error.message,
				code: error.name,
				timestamp: new Date().toISOString(),
				path: context.req.path
			}

			return context.json(response, 500)
		}
	}
}

const { app, hono } = await Application.create(AppModule, {
	onError: CustomErrorHandler.handle()
})
```

### Custom Not Found Handler

```typescript
class CustomNotFoundHandler {
	static handle() {
		return async (context: Context) => {
			return context.json(
				{
					message: 'The requested resource was not found',
					path: context.req.path,
					timestamp: new Date().toISOString()
				},
				404
			)
		}
	}
}

const { app, hono } = await Application.create(AppModule, {
	notFound: CustomNotFoundHandler.handle()
})
```
