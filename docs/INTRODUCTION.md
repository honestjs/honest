# Introduction to HonestJS

HonestJS is a modern, backend web framework for TypeScript and JavaScript, built on top of [Hono](httpss://hono.dev). It
brings the familiar, productive development experience of frameworks like NestJS to the high-performance Bun runtime,
while remaining compatible with other environments like Node.js and Deno.

## Core Philosophy

- **Developer Experience:** HonestJS is designed to be intuitive and easy to use. By leveraging decorators and a
  module-based architecture, it helps you write organized, maintainable, and scalable code.
- **Performance:** Built on Hono, one of the fastest web frameworks available, HonestJS is designed for speed and low
  overhead.
- **Flexibility:** While it provides a structured approach to building applications, it remains flexible. You can easily
  integrate other Hono middleware or even use the underlying Hono instance directly when you need to.

## Key Features

- **Modern Tooling:** Designed for Bun, but works everywhere.
- **NestJS-like Architecture:** Uses decorators for Controllers, Services, and Modules.
- **Dependency Injection:** A simple, yet powerful, DI container for managing your application's components.
- **Extensible:** Supports middleware, guards, pipes, filters, and plugins.
- **MVC and Frontend Rendering:** Includes support for building full-stack applications with JSX-based views.

## Getting Started: Hello, World!

Here's how to create a basic "Hello, World!" application with HonestJS.

### 1. Project Setup

Start by creating a new project and installing the necessary dependencies.

```bash
bun init
bun add honestjs reflect-metadata
bun add -d typescript @types/bun
```

Make sure your `tsconfig.json` has the following options enabled for decorator support:

```json
{
	"compilerOptions": {
		"experimentalDecorators": true,
		"emitDecoratorMetadata": true
		// ... other options
	}
}
```

### 2. Create the Service

Services are responsible for business logic. Let's create a service to provide our "Hello, World!" message.

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

### 3. Create the Controller

Controllers handle incoming requests and call services to get the job done.

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

### 4. Create the Module

Modules are used to organize your application's components.

`src/app.module.ts`

```typescript
import { Module } from 'honestjs'
import AppController from './app.controller'
import AppService from './app.service'

@Module({
	controllers: [AppController],
	services: [AppService]
})
class AppModule {}

export default AppModule
```

### 5. Create the Application Entrypoint

Finally, create the main application file that bootstraps your HonestJS app.

`src/main.ts`

```typescript
import { Application } from 'honestjs'
import 'reflect-metadata'
import AppModule from './app.module'

const { hono } = await Application.create(AppModule)

export default hono
```

Now you can run your application with `bun src/main.ts`.
