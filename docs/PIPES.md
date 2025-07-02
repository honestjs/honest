# Pipes in HonestJS

Pipes are classes that can transform or validate incoming data before it reaches the route handler. They are
particularly useful for handling DTOs (Data Transfer Objects) from request bodies, parameters, or queries.

A pipe must implement the `IPipe` interface, which has a single `transform` method.

```typescript
interface IPipe<T = any> {
	transform(value: T, metadata: ArgumentMetadata): any | Promise<any>
}
```

- `value`: The incoming data from the request.
- `metadata`: An object containing information about the parameter being processed, such as its type and the decorator
  used.

## Use Cases

Pipes have two main use cases:

1.  **Transformation:** Converting data from one form to another (e.g., converting a string ID to a number).
2.  **Validation:** Checking if the incoming data meets certain criteria and throwing an exception if it doesn't.

## Creating a Pipe

### Transformation Example

Here is a simple pipe that transforms a string value into a number.

```typescript
import { IPipe, ArgumentMetadata } from 'honestjs'

export class ParseIntPipe implements IPipe<string> {
	transform(value: string, metadata: ArgumentMetadata): number {
		const val = parseInt(value, 10)
		if (isNaN(val)) {
			throw new BadRequestException('Validation failed: not a number')
		}
		return val
	}
}
```

### Validation Example

A more common use case is validating an incoming request body against a DTO class. This is often done with libraries
like `class-validator` and `class-transformer`.

Here's an example of a `ValidationPipe`:

```typescript
import { IPipe, ArgumentMetadata } from 'honestjs'
import { plainToClass } from 'class-transformer'
import { validate } from 'class-validator'
import { BadRequestException } from 'http-essentials'

export class ValidationPipe implements IPipe {
	async transform(value: any, { metatype }: ArgumentMetadata) {
		if (!metatype || !this.toValidate(metatype)) {
			return value
		}
		const object = plainToClass(metatype, value)
		const errors = await validate(object)
		if (errors.length > 0) {
			throw new BadRequestException('Validation failed', { details: errors })
		}
		return value
	}

	private toValidate(metatype: Function): boolean {
		const types: Function[] = [String, Boolean, Number, Array, Object]
		return !types.includes(metatype)
	}
}
```

This pipe:

1. Checks if the parameter has a specific DTO type.
2. Uses `class-transformer` to convert the plain JavaScript object from the request into an instance of the DTO class.
3. Uses `class-validator` to validate the object based on the decorators in the DTO.
4. Throws an exception if validation fails.

## Applying Pipes

Pipes can be applied at the global, controller, or handler level using the `@UsePipes()` decorator. They can also be
applied to a specific parameter.

### Global Pipes

Global pipes are useful for applying validation to all incoming data. You can set a global `ValidationPipe` to ensure
all DTOs are validated automatically.

```typescript
// src/main.ts
const { hono } = await Application.create(AppModule, {
	components: {
		pipes: [new ValidationPipe()]
	}
})
```

### Parameter-level Pipes

You can also apply pipes to a specific parameter within a route handler.

```typescript
import { Body, Param, ParseIntPipe } from 'honestjs'

@Controller('/users')
export class UsersController {
	@Get('/:id')
	async findOne(@Param('id', ParseIntPipe) id: number) {
		// The `id` will be a number here, not a string
		return this.usersService.findById(id)
	}
}
```

In this example, the `ParseIntPipe` is applied only to the `id` parameter.

Pipes are a powerful tool for creating robust and type-safe APIs, reducing boilerplate code in your route handlers.
