# Decorators

This directory contains TypeScript decorators that provide the core functionality for the Honest framework, including
routing, dependency injection, middleware, and more.

## Overview

Decorators are the primary way to configure and extend the Honest framework. They provide a clean, declarative syntax
for defining routes, services, modules, and other framework components.

## Core Decorators

### Routing Decorators

#### `@Controller(route?, options?)`

Marks a class as a controller and defines the base route for all its endpoints.

```typescript
@Controller('users', { version: 1 })
class UsersController {
	// All routes in this controller will be prefixed with /v1/users
}
```

#### HTTP Method Decorators

Define HTTP endpoints with specific methods:

- **`@Get(path?, options?)`** - GET requests
- **`@Post(path?, options?)`** - POST requests
- **`@Put(path?, options?)`** - PUT requests
- **`@Delete(path?, options?)`** - DELETE requests
- **`@Patch(path?, options?)`** - PATCH requests
- **`@Options(path?, options?)`** - OPTIONS requests
- **`@All(path?, options?)`** - All HTTP methods

```typescript
@Controller('users')
class UsersController {
	@Get()
	getUsers() {}

	@Post()
	createUser() {}

	@Get(':id')
	getUser() {}
}
```

### Dependency Injection Decorators

#### `@Service()`

Marks a class as a service that can be injected as a dependency.

```typescript
@Service()
class UserService {
	getUsers() {
		return ['user1', 'user2']
	}
}

@Controller('users')
class UsersController {
	constructor(private userService: UserService) {}
}
```

#### `@Module(options)`

Defines a module that organizes controllers, services, and other modules.

```typescript
@Module({
	controllers: [UsersController],
	services: [UserService],
	imports: [AuthModule]
})
class AppModule {}
```

### Parameter Decorators

Extract and bind request data to method parameters:

- **`@Body(data?)`** - Request body or specific property
- **`@Param(data?)`** - Route parameters
- **`@Query(data?)`** - Query string parameters
- **`@Header(data?)`** - HTTP headers
- **`@Req()`** - Full request object
- **`@Res()`** - Response object
- **`@Ctx()`** - Hono context object
- **`@Var(data)`** - Context variables

```typescript
@Post()
createUser(
  @Body() userData: UserDto,
  @Param('id') id: string,
  @Query('include') include: string,
  @Header('authorization') auth: string
) { }
```

### Component Decorators

Apply middleware, guards, pipes, and filters:

#### `@UseMiddleware(...middleware)`

Applies middleware to a controller or method.

```typescript
@UseMiddleware(LoggerMiddleware, AuthMiddleware)
@Controller('users')
class UsersController {
	@UseMiddleware(RateLimitMiddleware)
	@Get()
	getUsers() {}
}
```

#### `@UseGuards(...guards)`

Applies guards for authorization and access control.

```typescript
@UseGuards(AuthGuard, RoleGuard)
@Controller('admin')
class AdminController {
	@UseGuards(AdminGuard)
	@Get('users')
	getUsers() {}
}
```

#### `@UsePipes(...pipes)`

Applies transformation and validation pipes.

```typescript
@UsePipes(ValidationPipe, TransformPipe)
@Controller('users')
class UsersController {
	@UsePipes(CustomPipe)
	@Post()
	createUser(@Body() user: UserDto) {}
}
```

#### `@UseFilters(...filters)`

Applies exception filters for error handling.

```typescript
@UseFilters(HttpExceptionFilter, ValidationExceptionFilter)
@Controller('users')
class UsersController {
	@UseFilters(CustomExceptionFilter)
	@Get()
	getUsers() {}
}
```

### MVC Decorators

Alternative decorators for MVC-style applications:

#### `@View(route?, options?)`

Alias for `@Controller` with MVC naming.

#### `@Page(path?, options?)`

Alias for `@Get` with MVC naming.

#### `@MvcModule(options)`

Enhanced module decorator with view support.

```typescript
@MvcModule({
	views: [HomeController],
	controllers: [ApiController],
	services: [DataService]
})
class AppModule {}
```

## Decorator Options

### Controller Options

```typescript
interface ControllerOptions {
	prefix?: string | null
	version?: number | null | typeof VERSION_NEUTRAL | number[]
}
```

### HTTP Method Options

```typescript
interface HttpMethodOptions {
	prefix?: string | null
	version?: number | null | typeof VERSION_NEUTRAL | number[]
}
```

### Module Options

```typescript
interface ModuleOptions {
	controllers?: Constructor[]
	services?: Constructor[]
	imports?: Constructor[]
}
```

## Best Practices

1. **Use descriptive route names** - Make routes self-documenting
2. **Group related endpoints** - Use controllers to organize related functionality
3. **Apply guards at controller level** - Reduce repetition and improve security
4. **Use pipes for validation** - Keep controllers focused on business logic
5. **Handle exceptions with filters** - Provide consistent error responses
6. **Leverage dependency injection** - Use services for reusable business logic

## Framework Integration

Decorators work together to provide:

- **Metadata collection** - Framework gathers decorator information
- **Route registration** - Automatic route mapping to handlers
- **Dependency resolution** - Automatic service instantiation and injection
- **Middleware composition** - Layered middleware application
- **Error handling** - Hierarchical exception filtering
