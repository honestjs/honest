# Honest Framework - Source Code

This directory contains the core source code for the Honest framework, a lightweight web framework built on top of Hono
with decorator-based routing, dependency injection, and modular architecture.

## Directory Structure

- **`application.ts`** - Main application class and entry point
- **`application-context.ts`** - App-level registry for pipeline data (see Application context below)
- **`components/`** - Reusable UI components and layouts
- **`constants/`** - Framework constants and configuration values
- **`decorators/`** - TypeScript decorators for routing, dependency injection, and middleware
- **`di/`** - Dependency injection container and related utilities
- **`handlers/`** - Error handling and request processing utilities
- **`helpers/`** - Utility functions and helper methods
- **`interfaces/`** - TypeScript interfaces and type definitions
- **`managers/`** - Core framework managers for components and routing
- **`registries/`** - Metadata and route registration systems (including runtime metadata repositories)
- **`testing/`** - Lightweight testing helpers for application, controller, and service-level tests
- **`types/`** - Custom TypeScript type definitions
- **`utils/`** - Common utility functions and helpers

## Framework Overview

Honest is designed to provide a clean, decorator-based API for building web applications with:

- **Decorator-based routing** with support for HTTP methods, parameters, and middleware
- **Dependency injection** for managing service instances and dependencies
- **Modular architecture** for organizing application components
- **Plugin system** for extending framework functionality (lifecycle hooks, optional pre/post processors; execution
  order follows `options.plugins`)
- **Snapshot-based runtime metadata isolation** so each app instance runs on immutable startup metadata
- **Version-aware routing** with support for API versioning
- **Startup guide diagnostics mode** with actionable hints for common startup failures
- **Comprehensive error handling** with customizable filters
- **Type-safe parameter binding** with transformation pipes
- **Guard-based authorization** for protecting routes

## Getting Started

```typescript
import { Application, Controller, Get, Module } from '@honest/framework'

@Controller('users')
class UsersController {
	@Get()
	getUsers() {
		return { users: [] }
	}
}

@Module({
	controllers: [UsersController]
})
class AppModule {}

const { app, hono } = await Application.create(AppModule)
```

## Key Features

- **Zero-config setup** with sensible defaults
- **TypeScript-first** design with full type safety
- **Hono integration** for high-performance request handling
- **Extensible architecture** with plugin support
- **Application context (registry)** for app and plugins to share pipeline data by key
- **Testing harness utilities** for fast setup in unit/integration tests
- **Comprehensive documentation** and examples

## Testing utilities

Core exports include lightweight testing helpers:

- `createTestingModule(options)` - Create a dynamic module class for tests.
- `createTestApplication(options)` - Start an app quickly and use `.request()` convenience helper.
- `createControllerTestApplication(options)` - Bootstrap an app around a single controller.
- `createServiceTestContainer(options)` - Use DI-only service testing with overrides and preload.

These helpers are designed to reduce boilerplate while keeping test setup explicit.

## Startup guide mode

Set `startupGuide` in `Application.create()` options to emit structured startup hints when initialization fails:

- `startupGuide: true` - concise, actionable hints
- `startupGuide: { verbose: true }` - includes extra guided troubleshooting steps

Guide hints cover common issues such as missing decorators, constructor metadata setup, and strict no-routes startup.

## Application context (registry)

The app-level registry is a typed key-value store on `Application` for the whole app-bootstrap code, services, and
plugins-to publish and read pipeline data by key. It is **not** the same as Hono’s request context: the former is
app-scoped and lives for the app lifetime (`app.getContext()`); the latter is per-request and injected in handlers via
`@Ctx()` (request/response, env, request-scoped variables). Use the application context for shared pipeline/config data;
use the request context for data that is specific to the current HTTP request.

- **Access**: `app.getContext()` returns the store. Use `get<T>(key)`, `set<T>(key, value)`, and optionally `has(key)`,
  `delete(key)`, `keys()`.
- **Keys**: Use namespaced keys (e.g. `rpc.artifact`, `openapi.spec`, `graphql.schema`) to avoid collisions. Contracts
  and types are defined by whoever owns each key; Honest core does not mandate key names or value types.
- **Versioning**: You can version keys (e.g. document that `rpc.artifact` v1 means a given shape) and introduce new keys
  without changing Honest.
- **Use cases**: App code storing build-time or config data, producer/consumer composition (e.g. one step writes an
  artifact, another reads it and writes a spec), or any shared pipeline data by key.
