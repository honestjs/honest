# Dependency Injection (DI)

This directory contains the dependency injection system for the Honest framework, providing automatic instantiation and
management of service dependencies.

## Overview

The dependency injection system allows you to define services and automatically inject them into controllers and other
services. It handles the creation, lifecycle management, and dependency resolution of class instances.

## Files

### `container.ts`

The main dependency injection container that:

- **Resolves dependencies** - Automatically creates instances with their dependencies
- **Manages singletons** - Ensures each service has only one instance
- **Handles circular dependencies** - Detects and prevents circular dependency issues
- **Supports custom instances** - Allows registration of pre-created instances

### `index.ts`

Export file that provides access to the DI container.

## Core Features

### Automatic Dependency Resolution

The container automatically resolves constructor dependencies using TypeScript's reflection metadata:

```typescript
@Service()
class DatabaseService {
	connect() {}
}

@Service()
class UserService {
	constructor(private db: DatabaseService) {}
	// DatabaseService is automatically injected
}

@Controller('users')
class UsersController {
	constructor(private userService: UserService) {}
	// UserService (and its DatabaseService dependency) are automatically injected
}
```

### Singleton Management

Each service is instantiated only once and reused across the application:

```typescript
@Service()
class LoggerService {
	private count = 0

	log(message: string) {
		this.count++
		console.log(`[${this.count}] ${message}`)
	}
}

// Both controllers get the same LoggerService instance
@Controller('users')
class UsersController {
	constructor(private logger: LoggerService) {}
}

@Controller('posts')
class PostsController {
	constructor(private logger: LoggerService) {}
}
```

### Circular Dependency Detection

The container prevents circular dependencies and provides clear error messages:

```typescript
@Service()
class ServiceA {
	constructor(private serviceB: ServiceB) {}
}

@Service()
class ServiceB {
	constructor(private serviceA: ServiceA) {} // This will throw an error
}
```

## Usage Examples

### Basic Service Registration

```typescript
@Service()
class EmailService {
	sendEmail(to: string, subject: string) {
		// Email sending logic
	}
}

@Controller('notifications')
class NotificationController {
	constructor(private emailService: EmailService) {}

	@Post('send')
	sendNotification(@Body() data: { to: string; message: string }) {
		return this.emailService.sendEmail(data.to, data.message)
	}
}
```

### Service with Dependencies

```typescript
@Service()
class ConfigService {
	getDatabaseUrl() {
		return process.env.DATABASE_URL
	}
}

@Service()
class DatabaseService {
	constructor(private config: ConfigService) {}

	connect() {
		const url = this.config.getDatabaseUrl()
		// Connect to database
	}
}

@Service()
class UserRepository {
	constructor(private db: DatabaseService) {}

	findUsers() {
		// Database query logic
	}
}
```

### Custom Instance Registration

```typescript
// Register a pre-created instance
const customLogger = new CustomLogger()
container.register(LoggerService, customLogger)

// Or register with custom configuration
const dbService = new DatabaseService({
	host: 'localhost',
	port: 5432
})
container.register(DatabaseService, dbService)
```

## Container API

### `resolve<T>(target: Constructor<T>): T`

Resolves a service instance, creating it if necessary:

```typescript
const userService = container.resolve(UserService)
```

### `register<T>(target: Constructor<T>, instance: T): void`

Registers a pre-created instance for a service:

```typescript
container.register(UserService, new UserService())
```

## Best Practices

1. **Use constructor injection** - Prefer constructor injection over property injection
2. **Keep services focused** - Each service should have a single responsibility
3. **Avoid circular dependencies** - Design services to avoid circular references
4. **Use interfaces** - Define interfaces for better testability and flexibility
5. **Register in modules** - Use the `@Module` decorator to organize service registration

## Framework Integration

The DI container is integrated throughout the framework:

- **Controller instantiation** - Controllers are resolved with their dependencies
- **Service management** - Services are automatically instantiated when needed
- **Component resolution** - Middleware, guards, pipes, and filters are resolved
- **Plugin system** - Plugins can access the container for custom functionality

## Error Handling

The container provides clear error messages for common issues:

- **Circular dependencies** - Detailed stack trace showing the dependency cycle
- **Missing dependencies** - Clear indication of which dependency couldn't be resolved
- **Invalid constructors** - Helpful messages for constructor-related issues

## Performance Considerations

- **Lazy instantiation** - Services are only created when first requested
- **Singleton caching** - Instances are cached and reused
- **Minimal reflection** - Uses efficient reflection metadata access
- **Memory efficient** - Automatic cleanup of unused references
