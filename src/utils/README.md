# Utils

This directory contains common utility functions and helpers that provide reusable functionality across the Honest
framework.

## Overview

Utils provide essential utility functions for type checking, path manipulation, and common operations used throughout
the framework. These utilities ensure consistency and reduce code duplication.

## Files

### `common.util.ts`

Contains common utility functions for:

- **Type checking** - Functions to check data types and values
- **Path manipulation** - Functions for working with URL paths
- **Object utilities** - Functions for object validation and manipulation
- **String utilities** - Functions for string processing and validation

### `index.ts`

Export file that provides access to all utility functions.

## Utility Functions

### Type Checking Functions

#### `isUndefined(obj: unknown): obj is undefined`

Checks if a value is undefined:

```typescript
import { isUndefined } from '@honest/framework'

if (isUndefined(value)) {
	// Handle undefined case
}
```

#### `isNil(val: unknown): val is null | undefined`

Checks if a value is null or undefined:

```typescript
import { isNil } from '@honest/framework'

if (isNil(value)) {
	// Handle null or undefined case
}
```

#### `isObject(val: unknown): val is Record<PropertyKey, unknown>`

Checks if a value is an object (not null, not primitive):

```typescript
import { isObject } from '@honest/framework'

if (isObject(value)) {
	// Safe to use as object
	Object.keys(value).forEach((key) => {
		// Process object properties
	})
}
```

#### `isPlainObject(val: unknown): val is Record<string, unknown>`

Checks if a value is a plain object (not array, not function, etc.):

```typescript
import { isPlainObject } from '@honest/framework'

if (isPlainObject(value)) {
	// Safe to use as plain object
	const keys = Object.keys(value)
}
```

#### `isFunction(val: unknown): val is Function`

Checks if a value is a function:

```typescript
import { isFunction } from '@honest/framework'

if (isFunction(value)) {
	// Safe to call as function
	const result = value()
}
```

#### `isString(val: unknown): val is string`

Checks if a value is a string:

```typescript
import { isString } from '@honest/framework'

if (isString(value)) {
	// Safe to use string methods
	const length = value.length
	const upper = value.toUpperCase()
}
```

#### `isNumber(val: unknown): val is number`

Checks if a value is a number:

```typescript
import { isNumber } from '@honest/framework'

if (isNumber(value)) {
	// Safe to use number methods
	const rounded = Math.round(value)
	const isInteger = Number.isInteger(value)
}
```

#### `isEmpty(array: unknown[]): boolean`

Checks if an array is empty:

```typescript
import { isEmpty } from '@honest/framework'

if (isEmpty(array)) {
	// Handle empty array case
}
```

#### `isSymbol(val: unknown): val is symbol`

Checks if a value is a symbol:

```typescript
import { isSymbol } from '@honest/framework'

if (isSymbol(value)) {
	// Safe to use symbol methods
	const description = value.description
}
```

### Path Manipulation Functions

#### `addLeadingSlash(path?: string): string`

Adds a leading slash to a path if it doesn't have one:

```typescript
import { addLeadingSlash } from '@honest/framework'

addLeadingSlash('users') // Returns: '/users'
addLeadingSlash('/users') // Returns: '/users'
addLeadingSlash('') // Returns: ''
addLeadingSlash(undefined) // Returns: ''
```

#### `normalizePath(path?: string): string`

Normalizes a path by ensuring proper slash handling:

```typescript
import { normalizePath } from '@honest/framework'

normalizePath('users') // Returns: '/users'
normalizePath('/users') // Returns: '/users'
normalizePath('users/') // Returns: '/users'
normalizePath('/users/') // Returns: '/users'
normalizePath('') // Returns: ''
normalizePath('/') // Returns: '/'
normalizePath(undefined) // Returns: ''
```

#### `stripEndSlash(path: string): string`

Removes trailing slash from a path:

```typescript
import { stripEndSlash } from '@honest/framework'

stripEndSlash('/users/') // Returns: '/users'
stripEndSlash('/users') // Returns: '/users'
stripEndSlash('/') // Returns: '/'
```

### Constructor Checking

#### `isConstructor(val: unknown): boolean`

Checks if a value is a constructor function:

```typescript
import { isConstructor } from '@honest/framework'

if (isConstructor(value)) {
	// Safe to use with 'new' keyword
	const instance = new value()
}
```

## Usage Examples

### Route Path Processing

```typescript
import { normalizePath, addLeadingSlash } from '@honest/framework'

class RouteBuilder {
	buildPath(prefix?: string, version?: string, controller?: string, method?: string): string {
		const parts = [
			addLeadingSlash(prefix),
			version ? `/v${version}` : '',
			addLeadingSlash(controller),
			addLeadingSlash(method)
		].filter(Boolean)

		return normalizePath(parts.join(''))
	}
}

const builder = new RouteBuilder()
const path = builder.buildPath('api', '1', 'users', 'profile')
// Returns: '/api/v1/users/profile'
```

### Type-Safe Object Processing

```typescript
import { isObject, isString, isNumber } from '@honest/framework'

function processConfig(config: unknown): Record<string, unknown> {
	if (!isObject(config)) {
		throw new Error('Config must be an object')
	}

	const processed: Record<string, unknown> = {}

	for (const [key, value] of Object.entries(config)) {
		if (isString(value) || isNumber(value)) {
			processed[key] = value
		}
	}

	return processed
}
```

### Validation Utilities

```typescript
import { isNil, isString, isEmpty } from '@honest/framework'

function validateUserData(data: unknown): boolean {
	if (isNil(data) || !isObject(data)) {
		return false
	}

	const { name, email, age } = data as Record<string, unknown>

	if (!isString(name) || isEmpty(name)) {
		return false
	}

	if (!isString(email) || !email.includes('@')) {
		return false
	}

	if (!isNumber(age) || age < 0) {
		return false
	}

	return true
}
```

### Component Registration

```typescript
import { isConstructor, isFunction } from '@honest/framework'

class ComponentRegistry {
	registerComponent(component: unknown): void {
		if (isConstructor(component)) {
			// Register class-based component
			this.registerClass(component)
		} else if (isFunction(component)) {
			// Register function-based component
			this.registerFunction(component)
		} else {
			throw new Error('Component must be a constructor or function')
		}
	}
}
```

## Best Practices

1. **Use type guards** - Leverage type checking functions for safe operations
2. **Normalize paths** - Always normalize paths for consistency
3. **Validate inputs** - Use utility functions to validate function parameters
4. **Handle edge cases** - Consider null, undefined, and empty values
5. **Maintain consistency** - Use the same utility functions across the codebase
6. **Document usage** - Provide clear examples for complex utility functions

## Framework Integration

Utility functions are used throughout the framework:

- **Route management** - Path normalization and construction
- **Parameter validation** - Type checking for request parameters
- **Component registration** - Validating component types
- **Error handling** - Checking error types and properties
- **Configuration processing** - Validating application configuration
- **Plugin system** - Type checking for plugin registration

## Performance Considerations

- **Efficient checks** - Type checking functions are optimized for performance
- **Minimal overhead** - Utility functions have minimal runtime cost
- **Cached results** - Path normalization results can be cached
- **Lazy evaluation** - Functions only process what's necessary
- **Memory efficient** - No unnecessary object creation

## Error Prevention

Utility functions help prevent common errors:

- **Type errors** - Catch type mismatches at runtime
- **Path errors** - Ensure consistent path formatting
- **Null reference errors** - Safe handling of null/undefined values
- **Object access errors** - Safe property access and iteration
- **Function call errors** - Validate function types before calling
