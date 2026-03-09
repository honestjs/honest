# Honest Framework - Source Code

This directory contains the core source code for the Honest framework, a lightweight web framework built on top of Hono
with decorator-based routing, dependency injection, and modular architecture.

## Directory Structure

- **`application.ts`** - Main application class and entry point
- **`components/`** - Reusable UI components and layouts
- **`constants/`** - Framework constants and configuration values
- **`decorators/`** - TypeScript decorators for routing, dependency injection, and middleware
- **`di/`** - Dependency injection container and related utilities
- **`handlers/`** - Error handling and request processing utilities
- **`helpers/`** - Utility functions and helper methods
- **`interfaces/`** - TypeScript interfaces and type definitions
- **`managers/`** - Core framework managers for components and routing
- **`registries/`** - Metadata and route registration systems
- **`types/`** - Custom TypeScript type definitions
- **`utils/`** - Common utility functions and helpers

## Framework Overview

Honest is designed to provide a clean, decorator-based API for building web applications with:

- **Decorator-based routing** with support for HTTP methods, parameters, and middleware
- **Dependency injection** for managing service instances and dependencies
- **Modular architecture** for organizing application components
- **Plugin system** for extending framework functionality
- **Version-aware routing** with support for API versioning
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
- **Comprehensive documentation** and examples

## Application context (registry)

The app-level registry is a typed key-value store on `Application` for the whole app—bootstrap code, services, and plugins—to publish and read pipeline data by key.

- **Access**: `app.getContext()` returns the store. Use `get<T>(key)`, `set<T>(key, value)`, and optionally `has(key)`, `delete(key)`, `keys()`.
- **Keys**: Use namespaced keys (e.g. `rpc.artifact`, `openapi.spec`, `graphql.schema`) to avoid collisions. Contracts and types are defined by whoever owns each key; Honest core does not mandate key names or value types.
- **Versioning**: You can version keys (e.g. document that `rpc.artifact` v1 means a given shape) and introduce new keys without changing Honest.
- **Use cases**: App code storing build-time or config data, producer/consumer composition (e.g. one step writes an artifact, another reads it and writes a spec), or any shared pipeline data by key.
