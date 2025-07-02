# Exception Filters in HonestJS

Exception filters provide a way to handle unhandled exceptions that occur during the request-response cycle. They allow
you to catch specific types of errors and send a customized response to the client.

By default, HonestJS has a built-in global exception filter that handles standard `Error` objects and `HttpException`s
from Hono. However, you can create your own custom filters to handle specific error cases.

## Creating an Exception Filter

An exception filter is a class that implements the `IFilter` interface. This interface has a `catch` method that
receives the exception and the Hono `Context`.

```typescript
interface IFilter<T = any> {
	catch(exception: T, context: Context): void | Promise<void>
}
```

- `exception`: The exception object that was thrown.
- `context`: The Hono `Context` object.

The `catch` method is responsible for handling the exception and sending a response to the client.

**Example:** A custom filter for a `NotFoundException`.

```typescript
import { IFilter } from 'honestjs'
import { Context } from 'hono'
import { NotFoundException } from 'http-essentials'

export class NotFoundExceptionFilter implements IFilter<NotFoundException> {
	catch(exception: NotFoundException, context: Context) {
		context.status(404)
		return context.json({
			statusCode: 404,
			message: 'The requested resource was not found.',
			error: 'Not Found',
			timestamp: new Date().toISOString(),
			path: context.req.path
		})
	}
}
```

This filter specifically catches `NotFoundException` and returns a formatted 404 response.

## Applying Filters

Filters can be applied at the global, controller, or handler level using the `@UseFilters()` decorator.

### Global Filters

Global filters are ideal for handling common exceptions across your entire application.

```typescript
// src/main.ts
const { hono } = await Application.create(AppModule, {
	components: {
		filters: [new NotFoundExceptionFilter()]
	}
})
```

### Controller-level and Handler-level Filters

You can also apply filters to a specific controller or route handler, which is useful for handling exceptions that are
specific to a particular part of your application.

```typescript
import { Controller, Get, UseFilters } from 'honestjs'
import { CustomExceptionFilter } from './filters/custom.filter'

@Controller('/special')
@UseFilters(CustomExceptionFilter)
export class SpecialController {
	@Get()
	doSomethingSpecial() {
		// If this handler throws a CustomException, it will be caught by the CustomExceptionFilter.
	}
}
```

## How it Works

When an exception is thrown and not caught by your application code, HonestJS's exception handling mechanism takes over.
It looks for filters that can handle the exception, starting from the handler-level, then controller-level, and finally
global-level filters.

The first filter that matches the exception type will be used to handle the exception. If no specific filter is found,
the default global exception filter will be used.

By using exception filters, you can centralize your error handling logic and provide consistent, well-formatted error
responses to your users.
