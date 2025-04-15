/**
 * Represents a class constructor type
 * Used throughout the framework for type-safe dependency injection and component registration
 *
 * @template T - The type of instance that the constructor creates
 * @example
 * ```ts
 * class MyService {}
 * const myConstructor: Constructor<MyService> = MyService;
 * ```
 */
export type Constructor<T = any> = new (...args: any[]) => T
