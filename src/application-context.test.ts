import { describe, expect, test } from 'bun:test'
import { ApplicationContext } from './application-context'

describe('ApplicationContext', () => {
	test('get/set returns set value', () => {
		const ctx = new ApplicationContext()
		ctx.set('foo', 42)
		expect(ctx.get<number>('foo')).toBe(42)
	})

	test('get missing key returns undefined', () => {
		const ctx = new ApplicationContext()
		expect(ctx.get('missing')).toBeUndefined()
	})

	test('has returns true for set key, false for missing', () => {
		const ctx = new ApplicationContext()
		expect(ctx.has('a')).toBe(false)
		ctx.set('a', 1)
		expect(ctx.has('a')).toBe(true)
	})

	test('delete removes key and returns true when key existed', () => {
		const ctx = new ApplicationContext()
		ctx.set('x', 1)
		expect(ctx.delete('x')).toBe(true)
		expect(ctx.has('x')).toBe(false)
		expect(ctx.get('x')).toBeUndefined()
		expect(ctx.delete('x')).toBe(false)
	})

	test('keys() returns iterator of all keys', () => {
		const ctx = new ApplicationContext()
		ctx.set('a', 1)
		ctx.set('b', 2)
		const keys = [...ctx.keys()]
		expect(keys).toContain('a')
		expect(keys).toContain('b')
		expect(keys.length).toBe(2)
	})

	test('get with wrong type returns value at runtime (caller responsibility)', () => {
		const ctx = new ApplicationContext()
		ctx.set('str', 'hello')
		// Cast to number at runtime is still the string - type erasure
		const asNumber = ctx.get<number>('str')
		expect(asNumber).toBe('hello')
	})
})
