<p align="center">
  <a href="https://github.com/honestjs/" target="blank"><img src="https://avatars.githubusercontent.com/u/197956909" width="120" alt="Honest Logo" /></a>
</p>

<p align="center">
A modern, TypeScript-first web framework built on top of <a href="https://hono.dev/" target="blank">Hono</a>, designed for building scalable and
maintainable web applications. Honest combines the elegance and architecture of <a href="https://nestjs.com/" target="blank">Nest</a> with the
ultra-fast performance of Hono, giving you the best of both worlds.
</p>

<p align="center">
	<a href="https://github.com/honestjs/website">
		<u>website</u>
	</a>
</p>

<p align="center">
	<a href="https://github.com/honestjs/examples">
		<u>examples</u>
	</a>
	|
	<a href="https://github.com/honestjs/templates">
		<u>templates</u>
	</a>
</p>

<p align="center">
	<a href="https://github.com/honestjs/middleware">
		<u>middleware</u>
	</a>
	|
	<a href="https://github.com/honestjs/guards">
		<u>guards</u>
	</a>
	|
	<a href="https://github.com/honestjs/pipes">
		<u>pipes</u>
	</a>
	|
	<a href="https://github.com/honestjs/filters">
		<u>filters</u>
	</a>
</p>

<p align="center">
	<a href="https://github.com/honestjs/http-essentials">
		<u>http-essentials</u>
	</a>
</p>

> 🚨 **Early Development Warning** 🚨
>
> Honest is currently in early development (pre-v1.0.0). Please be aware that:
>
> - The API is not stable and may change frequently
> - Breaking changes can occur between minor versions
> - Some features might be incomplete or missing
> - Documentation may not always be up to date
>
> We recommend not using it in production until v1.0.0 is released.

> ⚠️ **Documentation is not yet complete** ⚠️
>
> If you find any issues or have suggestions for improvements, please open an issue or submit a pull request.

## Features

- 🚀 **High Performance** - Built on top of the ultra-fast Hono framework
- 📦 **Modular Architecture** - Organize your code into reusable, feature-focused modules
- 💉 **Dependency Injection** - Built-in DI container for better code organization and testing
- 🔌 **Plugin System** - Extend functionality through a flexible plugin system
- 🛣️ **Advanced Routing** - Support for versioning, prefixes, and nested routes
- 🔒 **Built-in Security** - Guards, middleware, and error handling out of the box
- 🔄 **Request Pipeline** - Powerful middleware, guards, pipes, and filters
- 📝 **TypeScript-First** - Built with TypeScript for excellent type safety and IDE support

## Quick Start

### Using Honest CLI _(Coming Soon)_

The fastest way to create a new Honest application is to use the Honest CLI:

```bash
# Install Honest CLI globally
bun add -g @honestjs/cli
# or
pnpm add -g @honestjs/cli
# or
yarn global add @honestjs/cli
# or
npm install -g @honestjs/cli

# Create a new project
honest new my-project
cd my-project

# Start the development server
bun dev
```

This will create a new project with a standard directory structure and all necessary configuration files.

### Manual Setup

If you prefer to set up your project manually, follow these steps:

1. Install packages

```bash
bun add honestjs hono reflect-metadata
# or
pnpm add honestjs hono reflect-metadata
# or
yarn add honestjs hono reflect-metadata
# or
npm install honestjs hono reflect-metadata
```

2. Create your first controller:

```typescript
// app.controller.ts
import { Controller, Get } from 'honestjs'

@Controller()
class AppController {
	@Get()
	helloWorld() {
		return 'Hello, World!'
	}
}

export default AppController
```

3. Create a module:

```typescript
// app.module.ts
import { Module } from 'honestjs'
import { AppController } from './app.controller.ts'

@Module({
	controllers: [AppController]
})
class AppModule {}

export default AppModule
```

4. Bootstrap your application:

```typescript
import 'reflect-metadata'
import { Application } from 'honestjs'
import { AppModule } from './app.module'

const { app, hono } = await Application.create(AppModule, {
	routing: {
		prefix: 'api',
		version: 1
	}
})

export default hono
```

## License

MIT © [Orkhan Karimov](https://github.com/kerimovok)
