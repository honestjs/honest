import { describe, expect, test } from 'bun:test'
import {
	addLeadingSlash,
	isConstructor,
	isEmpty,
	isFunction,
	isNil,
	isNumber,
	isObject,
	isPlainObject,
	isString,
	isSymbol,
	isUndefined,
	normalizePath,
	stripEndSlash
} from './common.util'

describe('common.util', () => {
	describe('isUndefined', () => {
		test('returns true for undefined', () => {
			expect(isUndefined(undefined)).toBe(true)
		})
		test('returns false for null, 0, "", false', () => {
			expect(isUndefined(null)).toBe(false)
			expect(isUndefined(0)).toBe(false)
			expect(isUndefined('')).toBe(false)
			expect(isUndefined(false)).toBe(false)
		})
	})

	describe('isNil', () => {
		test('returns true for null and undefined', () => {
			expect(isNil(null)).toBe(true)
			expect(isNil(undefined)).toBe(true)
		})
		test('returns false for 0, "", false, {}', () => {
			expect(isNil(0)).toBe(false)
			expect(isNil('')).toBe(false)
			expect(isNil(false)).toBe(false)
			expect(isNil({})).toBe(false)
		})
	})

	describe('isObject', () => {
		test('returns true for plain object and arrays', () => {
			expect(isObject({})).toBe(true)
			expect(isObject({ a: 1 })).toBe(true)
			expect(isObject([])).toBe(true)
		})
		test('returns false for null, primitives, functions', () => {
			expect(isObject(null)).toBe(false)
			expect(isObject(undefined)).toBe(false)
			expect(isObject(1)).toBe(false)
			expect(isObject('')).toBe(false)
			expect(isObject(() => {})).toBe(false)
		})
	})

	describe('isPlainObject', () => {
		test('returns true for empty and non-empty object literals', () => {
			expect(isPlainObject({})).toBe(true)
			expect(isPlainObject({ a: 1 })).toBe(true)
		})
		test('returns false for array, class instance, null', () => {
			expect(isPlainObject([])).toBe(false)
			expect(isPlainObject(new (class Foo {})())).toBe(false)
			expect(isPlainObject(null)).toBe(false)
		})
	})

	describe('isFunction', () => {
		test('returns true for function and arrow function', () => {
			expect(isFunction(() => {})).toBe(true)
			expect(isFunction(function () {})).toBe(true)
		})
		test('returns false for non-functions', () => {
			expect(isFunction({})).toBe(false)
			expect(isFunction(null)).toBe(false)
			expect(isFunction('')).toBe(false)
		})
	})

	describe('isString', () => {
		test('returns true for string', () => {
			expect(isString('')).toBe(true)
			expect(isString('hello')).toBe(true)
		})
		test('returns false for number, object, null', () => {
			expect(isString(1)).toBe(false)
			expect(isString({})).toBe(false)
			expect(isString(null)).toBe(false)
		})
	})

	describe('isNumber', () => {
		test('returns true for number', () => {
			expect(isNumber(0)).toBe(true)
			expect(isNumber(1)).toBe(true)
			expect(isNumber(NaN)).toBe(true)
		})
		test('returns false for string, object, null', () => {
			expect(isNumber('1')).toBe(false)
			expect(isNumber({})).toBe(false)
			expect(isNumber(null)).toBe(false)
		})
	})

	describe('isEmpty', () => {
		test('returns true for empty array', () => {
			expect(isEmpty([])).toBe(true)
		})
		test('returns false for non-empty array', () => {
			expect(isEmpty([1])).toBe(false)
		})
	})

	describe('isSymbol', () => {
		test('returns true for symbol', () => {
			expect(isSymbol(Symbol())).toBe(true)
			expect(isSymbol(Symbol('foo'))).toBe(true)
		})
		test('returns false for string, number, object', () => {
			expect(isSymbol('')).toBe(false)
			expect(isSymbol(1)).toBe(false)
			expect(isSymbol({})).toBe(false)
		})
	})

	describe('addLeadingSlash', () => {
		test('adds slash when missing', () => {
			expect(addLeadingSlash('test')).toBe('/test')
		})
		test('leaves slash when present', () => {
			expect(addLeadingSlash('/test')).toBe('/test')
		})
		test('returns empty string for undefined', () => {
			expect(addLeadingSlash(undefined)).toBe('')
		})
	})

	describe('normalizePath', () => {
		test('normalizes double slashes and trailing slash', () => {
			expect(normalizePath('//test//')).toBe('/test')
		})
		test('normalizes path without leading slash and trailing slash', () => {
			expect(normalizePath('test/path//')).toBe('/test/path')
		})
		test('returns single slash for undefined', () => {
			expect(normalizePath(undefined)).toBe('/')
		})
		test('collapses consecutive slashes', () => {
			expect(normalizePath('/a//b///c')).toBe('/a/b/c')
		})
	})

	describe('stripEndSlash', () => {
		test('removes trailing slash', () => {
			expect(stripEndSlash('/test/')).toBe('/test')
		})
		test('leaves path unchanged when no trailing slash', () => {
			expect(stripEndSlash('/test')).toBe('/test')
		})
	})

	describe('isConstructor', () => {
		test('returns true for empty class (per JSDoc: class Test {})', () => {
			class Test {}
			expect(isConstructor(Test)).toBe(true)
		})
		test('returns true for class with prototype methods', () => {
			class Test {
				foo() {}
			}
			expect(isConstructor(Test)).toBe(true)
		})
		test('returns true for plain function (newable)', () => {
			function PlainFn() {}
			expect(isConstructor(PlainFn)).toBe(true)
		})
		test('returns false for arrow function (no prototype)', () => {
			expect(isConstructor(() => {})).toBe(false)
		})
		test('returns false for non-function', () => {
			expect(isConstructor({})).toBe(false)
			expect(isConstructor(null)).toBe(false)
		})
	})
})
