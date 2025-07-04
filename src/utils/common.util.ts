// Source: https://github.com/nestjs/nest/blob/master/packages/common/utils/shared.utils.ts
/**
 * Type guard that checks if a value is undefined
 * @param obj - The value to check
 * @returns True if the value is undefined, false otherwise
 */
export const isUndefined = (obj: unknown): obj is undefined => typeof obj === 'undefined'

/**
 * Type guard that checks if a value is null or undefined
 * @param val - The value to check
 * @returns True if the value is null or undefined, false otherwise
 */
export const isNil = (val: unknown): val is null | undefined => val === null || typeof val === 'undefined'

/**
 * Type guard that checks if a value is an object (excluding null)
 * @param val - The value to check
 * @returns True if the value is a non-null object, false otherwise
 */
export const isObject = (val: unknown): val is Record<PropertyKey, unknown> => val !== null && typeof val === 'object'

/**
 * Type guard that checks if a value is a plain object (not a class instance or array)
 * Determines if an object is a simple key-value store created by object literals
 *
 * @param val - The value to check
 * @returns True if the value is a plain object, false otherwise
 * @example
 * ```ts
 * isPlainObject({}) // true
 * isPlainObject(new Class()) // false
 * isPlainObject([]) // false
 * ```
 */
export const isPlainObject = (val: unknown): val is Record<string, unknown> => {
	if (!isObject(val)) {
		return false
	}
	const proto = Object.getPrototypeOf(val)
	if (proto === null) {
		return true
	}
	const ctor =
		Object.prototype.hasOwnProperty.call(proto, 'constructor') && (proto as { constructor: unknown }).constructor
	return (
		typeof ctor === 'function' &&
		ctor instanceof ctor &&
		Function.prototype.toString.call(ctor) === Function.prototype.toString.call(Object)
	)
}

/**
 * Type guard that checks if a value is a function
 * @param val - The value to check
 * @returns True if the value is a function, false otherwise
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export const isFunction = (val: unknown): val is Function => typeof val === 'function'

/**
 * Type guard that checks if a value is a string
 * @param val - The value to check
 * @returns True if the value is a string, false otherwise
 */
export const isString = (val: unknown): val is string => typeof val === 'string'

/**
 * Type guard that checks if a value is a number
 * @param val - The value to check
 * @returns True if the value is a number, false otherwise
 */
export const isNumber = (val: unknown): val is number => typeof val === 'number'

/**
 * Checks if an array is empty
 * @param array - The array to check
 * @returns True if the array has no elements, false otherwise
 */
export const isEmpty = (array: unknown[]): boolean => array.length === 0

/**
 * Type guard that checks if a value is a symbol
 * @param val - The value to check
 * @returns True if the value is a symbol, false otherwise
 */
export const isSymbol = (val: unknown): val is symbol => typeof val === 'symbol'

/**
 * Ensures a path starts with a leading slash
 * @param path - The path to process
 * @returns The path with a leading slash, or empty string if path is undefined
 * @example
 * ```ts
 * addLeadingSlash('test') // '/test'
 * addLeadingSlash('/test') // '/test'
 * ```
 */
export const addLeadingSlash = (path?: string): string =>
	typeof path === 'string' ? (path.charAt(0) !== '/' ? '/' + path : path) : ''

/**
 * Normalizes a path by ensuring:
 * - Starts with a single slash
 * - No trailing slashes
 * - No consecutive slashes
 *
 * @param path - The path to normalize
 * @returns The normalized path
 * @example
 * ```ts
 * normalizePath('//test//') // '/test'
 * normalizePath('test/path//') // '/test/path'
 * ```
 */
export const normalizePath = (path?: string): string =>
	path
		? path.startsWith('/')
			? ('/' + path.replace(/\/+$/, '')).replace(/\/+/g, '/')
			: '/' + path.replace(/\/+$/, '')
		: '/'

/**
 * Removes the trailing slash from a path
 * @param path - The path to process
 * @returns The path without a trailing slash
 * @example
 * ```ts
 * stripEndSlash('/test/') // '/test'
 * stripEndSlash('/test') // '/test'
 * ```
 */
export const stripEndSlash = (path: string): string => (path.endsWith('/') ? path.slice(0, -1) : path)

/**
 * Checks if a value is a constructor function
 * A constructor function must:
 * - Be a function
 * - Have a prototype
 * - Have prototype properties beyond the default ones
 *
 * @param val - The value to check
 * @returns True if the value is a constructor function, false otherwise
 * @example
 * ```ts
 * class Test {}
 * isConstructor(Test) // true
 * isConstructor(() => {}) // false
 * ```
 */
export const isConstructor = (val: unknown): boolean => {
	return (
		isFunction(val) &&
		!isNil(val.prototype) &&
		!isFunction(val.prototype) &&
		Object.getOwnPropertyNames(val.prototype).length > 1
	)
}
