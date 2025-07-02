# Plugins in HonestJS

Plugins provide a powerful way to extend HonestJS functionality by hooking into the application lifecycle. They allow
you to add custom features, integrate third-party services, or modify the application's behavior without changing the
core framework code.

## Plugin Interface

A plugin must implement the `IPlugin` interface, which provides two optional lifecycle hooks:

```typescript
interface IPlugin {
	beforeModulesRegistered?: (app: Application, hono: Hono) => void | Promise<void>
	afterModulesRegistered?: (app: Application, hono: Hono) => void | Promise<void>
}
```

Both hooks receive:

- `app`: The HonestJS `Application` instance
- `hono`: The underlying Hono application instance

## Lifecycle Hooks

### `beforeModulesRegistered`

This hook runs before any modules are registered with the application. Use this hook for:

- Setting up global services that modules might depend on
- Configuring the Hono instance
- Registering global middleware that needs to run before module-specific middleware
- Initializing external services (databases, caches, etc.)

### `afterModulesRegistered`

This hook runs after all modules have been registered. Use this hook for:

- Cleanup operations
- Final configuration that requires all modules to be loaded
- Setting up monitoring or health checks
- Registering catch-all routes

## Creating a Simple Plugin

Here's a basic example of a logging plugin:

```typescript
import { IPlugin } from 'honestjs'
import type { Application } from 'honestjs'
import type { Hono } from 'hono'

export class LoggerPlugin implements IPlugin {
	private logLevel: string

	constructor(logLevel: string = 'info') {
		this.logLevel = logLevel
	}

	async beforeModulesRegistered(app: Application, hono: Hono): Promise<void> {
		console.log(`[LoggerPlugin] Initializing with log level: ${this.logLevel}`)

		// Add a request logging middleware
		hono.use('*', async (c, next) => {
			const start = Date.now()
			console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.path} - Started`)

			await next()

			const duration = Date.now() - start
			console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.path} - ${c.res.status} (${duration}ms)`)
		})
	}

	async afterModulesRegistered(app: Application, hono: Hono): Promise<void> {
		console.log('[LoggerPlugin] All modules registered, logging is active')
	}
}
```

## Database Connection Plugin

Here's a more complex example that manages database connections:

```typescript
import { IPlugin } from 'honestjs'
import type { Application } from 'honestjs'
import type { Hono } from 'hono'

interface DatabaseConfig {
	host: string
	port: number
	database: string
	username: string
	password: string
}

export class DatabasePlugin implements IPlugin {
	private config: DatabaseConfig
	private connection: any = null

	constructor(config: DatabaseConfig) {
		this.config = config
	}

	async beforeModulesRegistered(app: Application, hono: Hono): Promise<void> {
		console.log('[DatabasePlugin] Connecting to database...')

		try {
			// Simulate database connection
			this.connection = await this.createConnection()

			// Make the connection available in Hono context
			hono.use('*', async (c, next) => {
				c.set('db', this.connection)
				await next()
			})

			console.log('[DatabasePlugin] Database connection established')
		} catch (error) {
			console.error('[DatabasePlugin] Failed to connect to database:', error)
			throw error
		}
	}

	async afterModulesRegistered(app: Application, hono: Hono): Promise<void> {
		console.log('[DatabasePlugin] Database plugin initialization complete')

		// Add a health check endpoint
		hono.get('/health/db', async (c) => {
			const isHealthy = await this.checkConnection()
			return c.json(
				{
					status: isHealthy ? 'healthy' : 'unhealthy',
					timestamp: new Date().toISOString()
				},
				isHealthy ? 200 : 503
			)
		})
	}

	private async createConnection(): Promise<any> {
		// Simulate connection creation
		return {
			host: this.config.host,
			port: this.config.port,
			connected: true
		}
	}

	private async checkConnection(): Promise<boolean> {
		// Simulate health check
		return this.connection && this.connection.connected
	}
}
```

## Configuration and Usage

Register plugins when creating your application:

```typescript
import { Application } from 'honestjs'
import { LoggerPlugin } from './plugins/logger.plugin'
import { DatabasePlugin } from './plugins/database.plugin'
import AppModule from './app.module'

const { hono } = await Application.create(AppModule, {
	plugins: [
		new LoggerPlugin('debug'),
		new DatabasePlugin({
			host: 'localhost',
			port: 5432,
			database: 'myapp',
			username: 'user',
			password: 'password'
		})
	]
})

export default hono
```

## Plugin Types

You can provide plugins in two ways:

1. **Plugin Instance**: Pass an already instantiated plugin object

```typescript
plugins: [new LoggerPlugin('debug')]
```

2. **Plugin Class**: Pass the plugin class (it will be instantiated automatically)

```typescript
plugins: [LoggerPlugin]
```

## Best Practices

### 1. Error Handling

Always handle errors gracefully in plugins, especially in the `beforeModulesRegistered` hook:

```typescript
async beforeModulesRegistered(app: Application, hono: Hono): Promise<void> {
	try {
		await this.initialize()
	} catch (error) {
		console.error('[MyPlugin] Initialization failed:', error)
		// Decide whether to throw (fail app startup) or continue
		throw error
	}
}
```

### 2. Resource Cleanup

Consider implementing cleanup logic:

```typescript
export class ResourcePlugin implements IPlugin {
	private resources: any[] = []

	async beforeModulesRegistered(app: Application, hono: Hono): Promise<void> {
		// Setup resources
		this.resources = await this.createResources()

		// Setup cleanup on process termination
		process.on('SIGTERM', () => this.cleanup())
		process.on('SIGINT', () => this.cleanup())
	}

	private async cleanup(): Promise<void> {
		console.log('[ResourcePlugin] Cleaning up resources...')
		await Promise.all(this.resources.map((resource) => resource.close()))
	}
}
```

### 3. Configuration Validation

Validate plugin configuration early:

```typescript
export class ConfigurablePlugin implements IPlugin {
	constructor(private config: any) {
		this.validateConfig(config)
	}

	private validateConfig(config: any): void {
		if (!config.requiredProperty) {
			throw new Error('[ConfigurablePlugin] requiredProperty is missing from configuration')
		}
	}
}
```

## Real-world Plugin Examples

### CORS Plugin

```typescript
export class CorsPlugin implements IPlugin {
	constructor(private origins: string[] = ['*']) {}

	async beforeModulesRegistered(app: Application, hono: Hono): Promise<void> {
		hono.use('*', async (c, next) => {
			c.header('Access-Control-Allow-Origin', this.origins.join(', '))
			c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
			c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

			if (c.req.method === 'OPTIONS') {
				return c.text('', 204)
			}

			await next()
		})
	}
}
```

### Metrics Plugin

```typescript
export class MetricsPlugin implements IPlugin {
	private requestCount = 0
	private requestDurations: number[] = []

	async beforeModulesRegistered(app: Application, hono: Hono): Promise<void> {
		hono.use('*', async (c, next) => {
			const start = Date.now()
			this.requestCount++

			await next()

			const duration = Date.now() - start
			this.requestDurations.push(duration)
		})
	}

	async afterModulesRegistered(app: Application, hono: Hono): Promise<void> {
		hono.get('/metrics', (c) => {
			const avgDuration =
				this.requestDurations.length > 0
					? this.requestDurations.reduce((a, b) => a + b, 0) / this.requestDurations.length
					: 0

			return c.json({
				totalRequests: this.requestCount,
				averageResponseTime: avgDuration,
				uptime: process.uptime()
			})
		})
	}
}
```

Plugins are a powerful way to keep your application modular and maintainable while adding the functionality you need.
