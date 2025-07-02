# Dependency Injection in HonestJS

HonestJS includes a simple and effective dependency injection (DI) container that manages the instantiation of your
classes and their dependencies. This allows you to write loosely coupled, testable, and maintainable code.

## Core Concepts

The DI system is built around a few key concepts:

- **Providers:** These are classes that can be "provided" by the DI container. In HonestJS, the most common providers
  are **Services**, but any class decorated with `@Service()` (or a similar custom decorator) can be a provider.
- **Consumers:** These are classes that consume providers. **Controllers** are the most common consumers.
- **Injection:** This is the process of providing an instance of a dependency to a consumer. HonestJS primarily uses
  **constructor injection**.

## Services

Services are the primary candidates for dependency injection. They are typically used to encapsulate business logic,
data access, or other concerns. To define a service, use the `@Service()` decorator.

**Example:**

`src/app.service.ts`

```typescript
import { Service } from 'honestjs'

@Service()
class AppService {
	helloWorld(): string {
		return 'Hello, World!'
	}
}

export default AppService
```

The `@Service()` decorator marks the `AppService` class as a provider that can be managed by the DI container.

## Constructor Injection

To inject a service into a controller (or another service), you simply declare it as a parameter in the consumer's
constructor.

**Example:**

`src/app.controller.ts`

```typescript
import { Controller, Get } from 'honestjs'
import AppService from './app.service'

@Controller()
class AppController {
	constructor(private readonly appService: AppService) {}

	@Get()
	helloWorld(): string {
		return this.appService.helloWorld()
	}
}

export default AppController
```

When the `AppController` is instantiated, the DI container will:

1. See that `AppController` has a dependency on `AppService`.
2. Look for an existing instance of `AppService`.
3. If no instance exists, it will create a new one.
4. It will then pass the `AppService` instance to the `AppController` constructor.

## How it Works

HonestJS's DI container maintains a map of class constructors to their instances. When a class is resolved:

- If an instance already exists in the container (i.e., it's a singleton), it's returned immediately.
- If not, the container inspects the constructor's parameter types using `reflect-metadata`.
- It then recursively resolves each dependency.
- Finally, it creates a new instance of the class with the resolved dependencies and stores it for future use.

## Best Practices & Edge Cases

- **Singleton Scope:** By default, all registered providers are singletons. This means that the same instance of a
  service is shared across the entire application.
- **Circular Dependencies:** The container can detect and will throw an error if you have circular dependencies. For
  example, if `ServiceA` depends on `ServiceB`, and `ServiceB` depends on `ServiceA`.
    ```
    Error: Circular dependency detected: ServiceA -> ServiceB -> ServiceA
    ```
- **Type-based Injection:** The DI system relies on TypeScript's `emitDecoratorMetadata` feature, which uses
  `reflect-metadata`. This works well for classes, but it has a limitation: you cannot inject a dependency using an
  interface as the type hint, because interfaces do not exist at runtime.

By following these principles, you can build robust and well-structured applications with clear separation of concerns.
