# Types

This directory contains custom TypeScript type definitions that provide type safety and utility types for the Honest
framework.

## Overview

Types define the fundamental type structures used throughout the framework, including constructor types, utility types,
and type aliases that enhance TypeScript's type system for the framework's specific needs.

## Files

### `constructor.type.ts`

Defines the core constructor type used throughout the framework:

- **Constructor type** - Generic type for class constructors
- **Type safety** - Ensures proper typing for dependency injection
- **Framework compatibility** - Used by DI container and component system

### `index.ts`

Export file that provides access to all type definitions.

## Core Types

### Constructor Type

The fundamental constructor type used throughout the framework:

```typescript
export type Constructor<T = any> = new (...args: any[]) => T
```

This type represents any class constructor that can be instantiated with the `new` keyword and returns an instance of
type `T`.

## Usage Examples

### Dependency Injection

```typescript
import { Constructor } from '@honest/framework'

class Container {
	resolve<T>(target: Constructor<T>): T {
		return new target()
	}
}

// Usage
const container = new Container()
const userService = container.resolve(UserService) // Type: UserService
```

### Service Registration

```typescript
import { Constructor } from '@honest/framework'

class ServiceRegistry {
	private services = new Map<Constructor, any>()

	register<T>(service: Constructor<T>, instance: T): void {
		this.services.set(service, instance)
	}

	get<T>(service: Constructor<T>): T {
		return this.services.get(service)
	}
}
```

### Component Management

```typescript
import { Constructor } from '@honest/framework'

interface IMiddleware {
	use(context: Context, next: Next): Promise<Response | void>
}

class ComponentManager {
	registerMiddleware(middleware: Constructor<IMiddleware>): void {
		// Register middleware class
	}

	registerMiddlewareInstance(middleware: IMiddleware): void {
		// Register middleware instance
	}
}
```

### Module Configuration

```typescript
import { Constructor } from '@honest/framework'

interface ModuleOptions {
	controllers?: Constructor[]
	services?: Constructor[]
	imports?: Constructor[]
}

@Module({
	controllers: [UsersController, PostsController],
	services: [UserService, PostService],
	imports: [AuthModule, DatabaseModule]
})
class AppModule {}
```

### Plugin System

```typescript
import { Constructor } from '@honest/framework'

interface IPlugin {
	beforeModulesRegistered?(app: Application, hono: Hono): void | Promise<void>
	afterModulesRegistered?(app: Application, hono: Hono): void | Promise<void>
}

class PluginManager {
	registerPlugin(plugin: Constructor<IPlugin> | IPlugin): void {
		if (typeof plugin === 'function') {
			// Register plugin class
			const instance = new plugin()
			this.setupPlugin(instance)
		} else {
			// Register plugin instance
			this.setupPlugin(plugin)
		}
	}
}
```

## Type Safety Benefits

### Generic Constraints

The `Constructor<T>` type enables proper generic constraints:

```typescript
// Without Constructor type
function resolveService(serviceClass: any): any {
	return new serviceClass()
}

// With Constructor type
function resolveService<T>(serviceClass: Constructor<T>): T {
	return new serviceClass()
}

// Usage with type safety
const userService = resolveService(UserService) // Type: UserService
const postService = resolveService(PostService) // Type: PostService
```

### Interface Implementation

Ensures classes implement required interfaces:

```typescript
interface IGuard {
	canActivate(context: Context): boolean | Promise<boolean>
}

class GuardManager {
	registerGuard(guard: Constructor<IGuard>): void {
		// Type-safe guard registration
	}
}

// TypeScript will ensure UserGuard implements IGuard
class UserGuard implements IGuard {
	canActivate(context: Context): boolean {
		return true
	}
}

const guardManager = new GuardManager()
guardManager.registerGuard(UserGuard) // ✅ Type-safe
```

### Dependency Resolution

Provides type safety for dependency injection:

```typescript
class Container {
	private instances = new Map<Constructor, any>()

	resolve<T>(target: Constructor<T>): T {
		if (this.instances.has(target)) {
			return this.instances.get(target)
		}

		const instance = new target()
		this.instances.set(target, instance)
		return instance
	}
}

// Usage with full type safety
const container = new Container()
const userService = container.resolve(UserService) // Type: UserService
const postService = container.resolve(PostService) // Type: PostService
```

## Framework Integration

The `Constructor` type is used throughout the framework:

### Dependency Injection Container

```typescript
interface DiContainer {
	resolve<T>(target: Constructor<T>): T
	register<T>(target: Constructor<T>, instance: T): void
}
```

### Component Registration

```typescript
type MiddlewareType = Constructor<IMiddleware> | IMiddleware
type GuardType = Constructor<IGuard> | IGuard
type PipeType = Constructor<IPipe> | IPipe
type FilterType = Constructor<IFilter> | IFilter
```

### Module Configuration

```typescript
interface ModuleOptions {
	controllers?: Constructor[]
	services?: Constructor[]
	imports?: Constructor[]
}
```

### Plugin System

```typescript
type PluginType = Constructor<IPlugin> | IPlugin
```

## Best Practices

1. **Use Constructor type** - Always use `Constructor<T>` for class constructors
2. **Leverage generics** - Use generic constraints for type safety
3. **Implement interfaces** - Ensure classes implement required interfaces
4. **Type your containers** - Use proper typing for dependency injection containers
5. **Document types** - Provide clear documentation for custom types
6. **Test type safety** - Verify that types work correctly in practice

## Type System Benefits

- **Compile-time safety** - Catches type errors at compile time
- **IntelliSense support** - Provides better IDE autocomplete
- **Refactoring safety** - Ensures refactoring doesn't break type contracts
- **Documentation** - Types serve as inline documentation
- **Error prevention** - Prevents runtime type errors
- **Framework consistency** - Ensures consistent typing across the framework
