import 'reflect-metadata'

export * from './application'
export * from './constants'
export * from './decorators'
export * from './di'
export * from './handlers'
export * from './helpers'
export * from './interfaces'
export * from './managers'
export * from './registries'
export * from './types'
export * from './utils'

declare global {
	namespace Reflect {
		function getMetadata(metadataKey: string, target: object): any
		function defineMetadata(metadataKey: string, metadataValue: any, target: object): void
		function hasMetadata(metadataKey: string, target: object): boolean
	}
}
