# MVC and View Rendering in HonestJS

Beyond creating REST APIs, HonestJS supports building traditional Model-View-Controller (MVC) applications with
server-side rendered views, powered by Hono's JSX engine.

## Core Concepts

The MVC support in HonestJS is built around a few custom decorators and concepts that extend the core framework:

- **Views:** These are special controllers designed for rendering UI. They are decorated with `@View()` instead of
  `@Controller()`.
- **Page Decorator:** A custom HTTP method decorator, `@Page()`, is used within Views to signify a method that renders a
  page. It's essentially a specialized `@Get()` decorator.
- **JSX and Layouts:** You can use JSX (`.tsx`) to define your components and layouts, which are then rendered to HTML
  by Hono's `jsxRenderer` middleware.

## Setting up an MVC Application

The `_templates/mvc` example provides a great starting point. Here's how it's set up:

### 1. Project Configuration

Your `tsconfig.json` needs to be configured to support JSX:

```json
{
	"compilerOptions": {
		"jsx": "react-jsx",
		"jsxImportSource": "hono/jsx"
	}
}
```

### 2. Custom Decorators

The MVC template uses a few custom decorators to make the code more expressive:

- `@View(route: string)`: A wrapper around `@Controller` that disables global prefixes and versioning, making it
  suitable for top-level page routes.
- `@Page()`: A custom decorator that is an alias for `@Get()`, used to clearly indicate that a method renders a view.
- `@ClientIP()`: A custom parameter decorator for getting the user's IP address.

### 3. Layouts and Components

You can create reusable layouts and components using JSX. The MVC template includes a main layout that provides a
consistent structure for all pages.

`src/layouts/MainLayout.tsx`

```typescript
import { jsx } from 'hono/jsx'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'

export const MainLayout = (props) => {
  return (
    <html>
      <body>
        <Header />
        <main>{props.children}</main>
        <Footer />
      </body>
    </html>
  )
}
```

### 4. Creating a View

A View looks very similar to a Controller, but it's focused on rendering UI.

`src/modules/users/users.view.tsx`

```typescript
import { Ctx } from 'honestjs'
import type { Context } from 'hono'
import { Page } from '../../decorators/http-method.decorator'
import { View } from '../../decorators/view.decorator'
import { UserList } from './components/UserList'
import UsersService from './users.service'

@View('/users')
class UsersView {
	constructor(private readonly usersService: UsersService) {}

	@Page()
	async index(@Ctx() ctx: Context) {
		const users = await this.usersService.findAll()
		return ctx.render(<UserList users={users} />, {
			title: 'Users',
			description: 'List of users'
		})
	}
}

export default UsersView
```

In this example:

- `@View('/users')` defines the base route for this view.
- `@Page()` marks the `index` method as the handler for `GET /users`.
- The method uses a `UsersService` (injected via DI) to fetch data.
- `ctx.render()` is used to render the `UserList` component within the main layout.

### 5. Wiring it all up

Finally, you need to configure the `jsxRenderer` middleware in your application's entrypoint.

`src/main.ts`

```typescript
import { Application } from 'honestjs'
import { HonoMiddleware } from '@honestjs/middleware' // Assuming a middleware wrapper
import { jsxRenderer } from 'hono/jsx-renderer'
import 'reflect-metadata'
import AppModule from './app.module'
import { MainLayout } from './layouts/MainLayout'

const { hono } = await Application.create(AppModule, {
	components: {
		middleware: [new HonoMiddleware(jsxRenderer(MainLayout))]
	}
})

export default hono
```

With this setup, you can build powerful, full-stack applications that combine the robust backend features of HonestJS
with a flexible JSX-based view layer.
