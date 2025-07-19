# Constants

This directory contains framework-wide constants and configuration values used throughout the Honest framework.

## Overview

Constants provide a centralized way to manage framework configuration values, special symbols, and shared constants that
are used across multiple parts of the framework.

## Files

### `version.constants.ts`

Contains constants related to API versioning functionality:

- **`VERSION_NEUTRAL`** - A special symbol used to mark routes as version-neutral, meaning they are accessible both with
  and without version prefixes.

### `index.ts`

Export file that provides access to all constants in this directory.

## Usage Examples

### Version-Neutral Routes

```typescript
import { VERSION_NEUTRAL } from '@honest/framework'

@Controller('health', { version: VERSION_NEUTRAL })
class HealthController {
	@Get()
	check() {
		return { status: 'ok' }
	}
}
```

### Global Version Configuration

```typescript
import { Application } from '@honest/framework'

const { app, hono } = await Application.create(AppModule, {
	routing: {
		version: 1, // All routes get /v1 prefix
		prefix: '/api'
	}
})
```

## Versioning System

The Honest framework supports flexible API versioning with several options:

1. **Global Version** - Set at application level, applies to all routes
2. **Controller Version** - Override global version for specific controllers
3. **Route Version** - Override controller version for specific routes
4. **Version Neutral** - Routes accessible with and without version prefix
5. **Multiple Versions** - Support for arrays of versions

### Version Examples

```typescript
// Global version 1
@Controller('users') // -> /v1/users

// Controller-specific version
@Controller('users', { version: 2 }) // -> /v2/users

// Version neutral
@Controller('health', { version: VERSION_NEUTRAL }) // -> /health AND /v1/health

// Multiple versions
@Controller('users', { version: [1, 2] }) // -> /v1/users AND /v2/users

// Opt out of versioning
@Controller('users', { version: null }) // -> /users (no version)
```

## Best Practices

1. **Use constants for magic values** - Avoid hardcoding special symbols
2. **Document versioning strategy** - Make versioning decisions explicit
3. **Consider backward compatibility** - Use version-neutral routes for stable endpoints
4. **Plan version transitions** - Use multiple versions during migration periods
5. **Keep versions consistent** - Use the same versioning approach across related endpoints

## Framework Integration

Constants are used throughout the framework in:

- **Route Registration** - Determining route paths and versioning
- **Metadata Processing** - Storing version information in route metadata
- **Path Generation** - Building final route paths with proper versioning
- **Plugin System** - Allowing plugins to access framework constants
