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
> If you find any issues or have suggestions for improvements, please open an issue or submit a pull request. See
> [CONTRIBUTING.md](CONTRIBUTING.md) for how to contribute and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community
> guidelines.

## Quick Start

```bash
bun add -g @honestjs/cli
honestjs new my-project   # alias: honest, hnjs
cd my-project
bun dev
```

This creates a new project with a standard structure and config. Use the [website](https://github.com/honestjs/website)
for full docs.

## Features

- **🚀 High performance** — Built on Hono for maximum speed and minimal overhead.
- **🏗️ Familiar architecture** — Decorator-based API inspired by NestJS; TypeScript-first.
- **💉 Dependency injection** — Built-in DI container for clean, testable code and automatic wiring.
- **🔌 Plugin system** — Extend the app with custom plugins, middleware, pipes, and filters.
- **🛣️ Advanced routing** — Prefixes, API versioning, and nested route organization.
- **🛡️ Request pipeline** — Middleware, guards, pipes, and filters at app, controller, or handler level.
- **📝 TypeScript-first** — Strong typing and great IDE support out of the box.
- **🖥️ MVC & SSR** — Full-stack apps with Hono JSX views; use the `mvc` template or the docs.

### In code

```typescript
import 'reflect-metadata'
import { Application, Controller, Get, Module, Service, UseGuards } from 'honestjs'

@Service()
class AppService {
	hello(): string {
		return 'Hello, Honest!'
	}
}

@Controller()
class AppController {
	constructor(private readonly appService: AppService) {}

	@Get()
	// @UseGuards(AuthGuard)
	// @UsePipes(ValidationPipe)
	hello() {
		return this.appService.hello()
	}
}

@Module({
	controllers: [AppController],
	services: [AppService]
})
class AppModule {}

const { app, hono } = await Application.create(AppModule, {
	routing: { prefix: 'api', version: 1 }
})
export default hono
```

Controllers, services, and modules are wired by decorators; use **guards** for auth, **pipes** for validation, and
**filters** for error handling. See the [documentation](https://github.com/honestjs/website) for details.

## License

MIT © [Orkhan Karimov](https://github.com/kerimovok)
