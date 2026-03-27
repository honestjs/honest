<p align="center">
  <a href="https://github.com/honestjs/" target="blank"><img src="https://honestjs.dev/images/honestjs.png" width="120" alt="Honest.js Logo" /></a>
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

<hr />

<div align="center">

[![GitHub](https://img.shields.io/github/license/honestjs/honest)](https://github.com/honestjs/honest/blob/main/LICENSE)
[![npm](https://img.shields.io/npm/v/honestjs)](https://www.npmjs.com/package/honestjs)
[![npm](https://img.shields.io/npm/dm/honestjs)](https://www.npmjs.com/package/honestjs)
[![Bundle Size](https://img.shields.io/bundlephobia/min/honestjs)](https://bundlephobia.com/result?p=honestjs)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/honestjs)](https://bundlephobia.com/result?p=honestjs)
[![GitHub commit activity](https://img.shields.io/github/commit-activity/m/honestjs/honest)](https://github.com/honestjs/honest/pulse)
[![GitHub last commit](https://img.shields.io/github/last-commit/honestjs/honest)](https://github.com/honestjs/honest/commits/main)
[![Discord badge](https://img.shields.io/discord/1482150663432442026?label=Discord&logo=Discord)](https://discord.gg/g3TUeXbeq)

</div>

## Cursor / Agent skills

Install the Honest skill so your editor agent (e.g. Cursor) can use Honest-specific guidance:

```bash
bunx skills add https://github.com/honestjs/skills --skill honest
```

See [honestjs/skills](https://github.com/honestjs/skills) for details.

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
- **🧩 Plugin contracts** — Deterministic plugin ordering and startup capability validation.
- **🛣️ Advanced routing** — Prefixes, API versioning, and nested route organization.
- **🛡️ Request pipeline** — Middleware, guards, pipes, and filters at app, controller, or handler level.
- **🧪 Lightweight testing harness** — Helpers for application, controller, and service-level tests.
- **🧭 Startup guide mode** — Actionable diagnostics hints for startup failures.
- **📝 TypeScript-first** — Strong typing and great IDE support out of the box.
- **🖥️ MVC & SSR** — Full-stack apps with Hono JSX views; use the `mvc` template or the docs.

### In code

```typescript
import 'reflect-metadata'
import { Application, Controller, Get, Module, Service } from 'honestjs'
import { LoggerMiddleware } from '@honestjs/middleware'
import { AuthGuard } from '@honestjs/guards'
import { ValidationPipe } from '@honestjs/pipes'
import { HttpExceptionFilter } from '@honestjs/filters'
import { ApiDocsPlugin } from '@honestjs/api-docs-plugin'

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
	startupGuide: { verbose: true },
	debug: {
		routes: true,
		plugins: true,
		pipeline: true,
		di: true,
		startup: true
	},
	logger: myLogger,
	strict: { requireRoutes: true },
	deprecations: { printPreV1Warning: true },
	container: myContainer,
	hono: {
		strict: true,
		router: customRouter
	},
	routing: {
		prefix: 'api',
		version: 1
	},
	// Components: use class (e.g. AuthGuard) or instance (e.g. new LoggerMiddleware()) to pass options
	components: {
		middleware: [new LoggerMiddleware()],
		guards: [AuthGuard],
		pipes: [ValidationPipe],
		filters: [HttpExceptionFilter]
	},
	plugins: [
		new RPCPlugin(),
		new ApiDocsPlugin(),
		{
			plugin: MyPlugin,
			name: 'core',
			preProcessors: [pre],
			postProcessors: [post]
		},
		{ plugin: MetricsPlugin, name: 'metrics', after: ['core'] }
	],
	onError: (err, c) => c.json({ error: err.message }, 500),
	notFound: (c) => c.json({ error: 'Not found' }, 404)
})

export default hono
```

Controllers, services, and modules are wired by decorators; use **guards** for auth, **pipes** for validation, and
**filters** for error handling. See the [documentation](https://github.com/honestjs/website) for details.

## Runtime Metadata Isolation

Decorator metadata is still collected globally, but each application instance now runs on an immutable metadata snapshot
captured during startup. This prevents metadata mutations made after bootstrap from changing behavior in already-running
applications.

## Plugin ordering and capability contracts

Use named plugin entries when order matters and optionally declare startup capability contracts via `meta`.

```typescript
class ArtifactPlugin {
	meta = {
		name: 'artifact',
		provides: ['artifact:routes']
	}
}

class DocsPlugin {
	meta = {
		name: 'docs',
		requires: ['artifact:routes']
	}
}

await Application.create(AppModule, {
	plugins: [
		{ plugin: new DocsPlugin(), name: 'docs', after: ['artifact'] },
		{ plugin: new ArtifactPlugin(), name: 'artifact' }
	]
})
```

If constraints are invalid (missing dependency, cycle, or missing required capability), startup fails fast.

## Testing harness

Honest exports lightweight helpers for common test setups.

```typescript
import { createControllerTestApplication, createServiceTestContainer, createTestApplication } from 'honestjs'

const app = await createTestApplication({
	controllers: [UsersController],
	services: [UsersService]
})

const response = await app.request('/users')

const controllerApp = await createControllerTestApplication({
	controller: UsersController
})

const services = createServiceTestContainer({
	preload: [UsersService],
	overrides: [{ provide: UsersService, useValue: mockUsersService }]
})
```

### Running tests in this package

This repo uses [Bun's test runner](https://bun.sh/docs/cli/test). From the package root:

- `bun test` — run all tests once
- `bun test --watch` — watch mode
- `bun test <pattern>` — limit to matching file or test names (for example `bun test application.bootstrap`)
- `bun run test:coverage` — same suite with coverage (summary in the terminal and `coverage/lcov.info`)

Co-locate tests as `*.test.ts` next to sources. Import `reflect-metadata` first in any file that loads decorated
classes, same as in application code.

Integration-style cases use `*.integration.test.ts` where the whole `Application` stack is exercised (for example the
request pipeline). Shared HTTP fixtures for application tests live under `src/testing/fixtures/` as **factory
functions** so each test gets fresh decorator metadata after `MetadataRegistry.clear()` in `afterEach`.

## Startup diagnostics guide mode

Enable startup guidance to get actionable remediation hints when initialization fails.

```typescript
await Application.create(AppModule, {
	startupGuide: true
})

await Application.create(AppModule, {
	startupGuide: { verbose: true }
})
```

Guide mode emits startup diagnostics hints for common issues such as missing decorators, strict no-routes startup,
metadata issues, and plugin ordering/capability errors.

## License

MIT © [Orkhan Karimov](https://github.com/kerimovok)
