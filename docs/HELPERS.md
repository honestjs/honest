# Helper Functions in HonestJS

HonestJS provides several powerful helper functions that enable you to extend the framework's functionality. These
helpers allow you to create custom decorators, standardize error responses, and build reusable components that integrate
seamlessly with the framework's architecture.

## Error Response Helper

The `createErrorResponse` helper function provides a standardized way to format error responses across your application,
ensuring consistency and proper HTTP status handling.

### Function Signature

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

### Features

- **Automatic Status Detection**: Extracts HTTP status codes from various exception types
- **Request Context Integration**: Includes request path, timestamp, and request ID
- **Environment-Aware**: Shows stack traces in development, hides sensitive info in production
- **HTTPException Support**: Built-in support for Hono's HTTPException
- **Flexible Overrides**: Allows customization of status, message, and additional details

### Usage Examples

**Basic Error Handling:**

```typescript
import { createErrorResponse, type IFilter } from 'honestjs'
import type { Context } from 'hono'

export class AllExceptionsFilter implements IFilter {
	catch(exception: Error, context: Context): Response {
		const { response, status } = createErrorResponse(exception, context)

		console.log(`[Error]: ${exception.message}`)
		return context.json(response, status)
	}
}
```

**Custom Error with Overrides:**

```typescript
export class ValidationFilter implements IFilter {
	catch(exception: ValidationError, context: Context): Response {
		const { response, status } = createErrorResponse(exception, context, {
			status: 422,
			title: 'Validation Failed',
			detail: 'The submitted data failed validation checks',
			code: 'VALIDATION_ERROR',
			additionalDetails: {
				fields: exception.errors,
				validationRules: exception.rules
			}
		})

		return context.json(response, status)
	}
}
```

**HTTP Exception Handling:**

```typescript
import { HTTPException } from 'hono/http-exception'

export class HttpExceptionFilter implements IFilter {
	catch(exception: HTTPException, context: Context): Response {
		const { response, status } = createErrorResponse(exception, context, {
			code: 'HTTP_EXCEPTION'
		})

		// Status and message automatically extracted from HTTPException
		return context.json(response, status)
	}
}
```

### Response Format

The helper generates a standardized error response structure:

```typescript
interface ErrorResponse {
	status: number // HTTP status code
	message: string // Error message
	timestamp: string // ISO timestamp
	path: string // Request path
	requestId?: string // Request ID (if available)
	code?: string // Error code
	details?: any // Additional details
	detail?: string // Detailed description
}
```

## HTTP Method Decorator Helper

The `createHttpMethodDecorator` helper allows you to create custom HTTP method decorators for any HTTP verb, including
non-standard methods.

### Function Signature

```typescript
function createHttpMethodDecorator(method: string): (path?: string, options?: HttpMethodOptions) => MethodDecorator
```

### Parameters

- `method`: The HTTP method string (e.g., 'GET', 'POST', 'PROPFIND', 'PURGE')
- `path`: Optional route path (defaults to empty string)
- `options`: Optional configuration object with version and prefix settings

### Usage Examples

**Creating Standard HTTP Methods:**

```typescript
import { createHttpMethodDecorator } from 'honestjs'

// Create standard REST decorators
export const Get = createHttpMethodDecorator('GET')
export const Post = createHttpMethodDecorator('POST')
export const Put = createHttpMethodDecorator('PUT')
export const Delete = createHttpMethodDecorator('DELETE')
export const Patch = createHttpMethodDecorator('PATCH')
```

**Creating WebDAV Methods:**

```typescript
import { HttpMethod } from 'http-essentials'

export const PropFind = createHttpMethodDecorator(HttpMethod.PROPFIND)
export const PropPatch = createHttpMethodDecorator(HttpMethod.PROPPATCH)
export const MkCol = createHttpMethodDecorator(HttpMethod.MKCOL)
export const Copy = createHttpMethodDecorator(HttpMethod.COPY)
export const Move = createHttpMethodDecorator(HttpMethod.MOVE)
export const Lock = createHttpMethodDecorator(HttpMethod.LOCK)
export const Unlock = createHttpMethodDecorator(HttpMethod.UNLOCK)
```

**Creating Custom HTTP Methods:**

```typescript
// Create decorators for HTTP extension methods
export const Head = createHttpMethodDecorator('HEAD')
export const Connect = createHttpMethodDecorator('CONNECT')
export const Trace = createHttpMethodDecorator('TRACE')
export const Purge = createHttpMethodDecorator('PURGE')
export const Search = createHttpMethodDecorator('SEARCH')
export const Report = createHttpMethodDecorator('REPORT')
```

**Using Custom Methods in Controllers:**

```typescript
import { Controller, Param, Header } from 'honestjs'
import { PropFind, Copy, Purge } from './decorators/webdav.decorators'

@Controller('/webdav')
export class WebDAVController {
	@PropFind('/*')
	async propFind(@Param('*') path: string) {
		// Handle PROPFIND requests for WebDAV
		return this.webdavService.getProperties(path)
	}

	@Copy('/*')
	async copyResource(@Param('*') sourcePath: string, @Header('Destination') destination: string) {
		// Handle COPY requests
		return this.webdavService.copyResource(sourcePath, destination)
	}

	@Purge('/cache/*')
	async purgeCache(@Param('*') cachePath: string) {
		// Handle cache purge requests
		return this.cacheService.purge(cachePath)
	}
}
```

**With Versioning and Prefixes:**

```typescript
// Create versioned API methods
export const GetV2 = createHttpMethodDecorator('GET')

@Controller('/api')
export class ApiController {
	@GetV2('/users', { version: 'v2', prefix: '/api' })
	async getUsersV2() {
		// This will handle GET /api/v2/users
		return this.userService.findAllV2()
	}
}
```

## Parameter Decorator Helper

The `createParamDecorator` helper enables you to create custom parameter decorators that extract and transform data from
the request context.

### Function Signature

```typescript
function createParamDecorator<T = any>(
	type: string,
	factory?: (data: any, ctx: Context) => T
): (data?: any) => ParameterDecorator
```

### Parameters

- `type`: Unique identifier for the parameter type
- `factory`: Optional transformation function that receives decorator data and Hono context

### Usage Examples

**Built-in Parameter Decorators:**

```typescript
import { createParamDecorator } from 'honestjs'
import type { Context } from 'hono'

// Basic decorators without transformation
export const Body = createParamDecorator('body', async (data, ctx: Context) => {
	const body = await ctx.req.json()
	return data ? body[data] : body
})

export const Param = createParamDecorator('param', (data, ctx: Context) => {
	return data ? ctx.req.param(data) : ctx.req.param()
})

export const Query = createParamDecorator('query', (data, ctx: Context) => {
	return data ? ctx.req.query(data) : ctx.req.query()
})

export const Header = createParamDecorator('header', (data, ctx: Context) => {
	return data ? ctx.req.header(data) : ctx.req.header()
})
```

**Advanced Custom Decorators:**

```typescript
// Client IP extraction with fallbacks
export const ClientIP = createParamDecorator('ip', (_, ctx: Context) => {
	const forwardedFor = ctx.req.header('x-forwarded-for')
	const realIP = ctx.req.header('x-real-ip')
	const cfIP = ctx.req.header('cf-connecting-ip')

	return forwardedFor?.split(',')[0].trim() || realIP || cfIP || 'unknown'
})

// User agent parsing
export const UserAgent = createParamDecorator('user-agent', (_, ctx: Context) => {
	const userAgent = ctx.req.header('user-agent') || 'unknown'
	return {
		raw: userAgent,
		isMobile: /Mobile|Android|iPhone|iPad/.test(userAgent),
		isBot: /bot|crawler|spider/i.test(userAgent),
		browser: userAgent.match(/(?:Chrome|Firefox|Safari|Edge)\/[\d.]+/)?.[0] || 'unknown'
	}
})

// Request timing
export const RequestTime = createParamDecorator('request-time', () => {
	return Date.now()
})

// Locale extraction from multiple sources
export const Locale = createParamDecorator('locale', (fallback = 'en', ctx: Context) => {
	// Check query parameter first
	const queryLocale = ctx.req.query('locale')
	if (queryLocale) return queryLocale

	// Check header
	const acceptLanguage = ctx.req.header('accept-language')
	if (acceptLanguage) {
		const primaryLocale = acceptLanguage.split(',')[0].split('-')[0]
		return primaryLocale
	}

	return fallback
})

// JWT token extraction and parsing
export const JwtPayload = createParamDecorator('jwt', (_, ctx: Context) => {
	const authHeader = ctx.req.header('authorization')
	if (!authHeader?.startsWith('Bearer ')) {
		throw new Error('No valid JWT token found')
	}

	const token = authHeader.substring(7)
	// Parse JWT payload (simplified - use proper JWT library in production)
	const payload = JSON.parse(atob(token.split('.')[1]))
	return payload
})

// File upload handler
export const UploadedFile = createParamDecorator('file', async (fieldName, ctx: Context) => {
	const formData = await ctx.req.formData()
	const file = formData.get(fieldName || 'file') as File

	if (!file) {
		throw new Error(`No file found in field: ${fieldName || 'file'}`)
	}

	return {
		name: file.name,
		size: file.size,
		type: file.type,
		buffer: await file.arrayBuffer(),
		stream: file.stream()
	}
})
```

**Using Custom Parameter Decorators:**

```typescript
import { Controller, Get, Post } from 'honestjs'
import { ClientIP, UserAgent, RequestTime, Locale, JwtPayload, UploadedFile } from './decorators/parameter.decorators'

@Controller('/api')
export class ApiController {
	@Get('/info')
	getRequestInfo(
		@ClientIP() ip: string,
		@UserAgent() userAgent: any,
		@RequestTime() timestamp: number,
		@Locale('en') locale: string
	) {
		return {
			clientIP: ip,
			userAgent,
			timestamp,
			locale,
			serverTime: new Date().toISOString()
		}
	}

	@Get('/profile')
	getProfile(@JwtPayload() user: any) {
		return {
			userId: user.sub,
			email: user.email,
			roles: user.roles
		}
	}

	@Post('/upload')
	async uploadFile(@UploadedFile('document') file: any) {
		// Process uploaded file
		return {
			fileName: file.name,
			fileSize: file.size,
			uploadedAt: new Date().toISOString()
		}
	}
}
```

**Complex Data Transformation:**

```typescript
// Pagination parameters with defaults and validation
export const Pagination = createParamDecorator('pagination', (defaults = {}, ctx: Context) => {
	const page = parseInt(ctx.req.query('page') || '1', 10)
	const limit = parseInt(ctx.req.query('limit') || '10', 10)
	const sortBy = ctx.req.query('sortBy') || defaults.sortBy || 'id'
	const sortOrder = ctx.req.query('sortOrder') || defaults.sortOrder || 'asc'

	// Validation
	if (page < 1) throw new Error('Page must be >= 1')
	if (limit < 1 || limit > 100) throw new Error('Limit must be between 1 and 100')
	if (!['asc', 'desc'].includes(sortOrder)) throw new Error('Sort order must be asc or desc')

	return {
		page,
		limit,
		offset: (page - 1) * limit,
		sortBy,
		sortOrder
	}
})

// Usage
@Controller('/users')
export class UsersController {
	@Get()
	async findAll(@Pagination({ sortBy: 'name', sortOrder: 'asc' }) pagination: any) {
		return this.userService.findMany({
			offset: pagination.offset,
			limit: pagination.limit,
			sortBy: pagination.sortBy,
			sortOrder: pagination.sortOrder
		})
	}
}
```

## Best Practices

1. **Error Handling**: Always use `createErrorResponse` for consistent error formatting
2. **Type Safety**: Provide proper TypeScript types for your custom decorators
3. **Validation**: Include validation logic in parameter decorator factories
4. **Documentation**: Document custom decorators with JSDoc comments
5. **Reusability**: Create helper utilities that can be shared across projects
6. **Testing**: Write unit tests for custom decorator logic

These helper functions form the foundation of HonestJS's extensibility, allowing you to create powerful, reusable
components that integrate seamlessly with the framework's decorator-based architecture.
