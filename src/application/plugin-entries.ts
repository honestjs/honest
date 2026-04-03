import type { IPlugin, PluginEntry, PluginProcessor } from '../interfaces'
import type { Constructor } from '../types'
import { isConstructor } from '../utils'

export const DEFAULT_PLUGIN_NAME = 'AnonymousPlugin'

export interface NormalizedPluginEntry {
	plugin: IPlugin
	name: string
	preProcessors: PluginProcessor[]
	postProcessors: PluginProcessor[]
}

export function resolvePlugin(pluginType: Constructor<IPlugin> | IPlugin): IPlugin {
	if (isConstructor(pluginType)) {
		return new (pluginType as Constructor<IPlugin>)()
	}
	return pluginType as IPlugin
}

export function resolvePluginName(plugin: IPlugin, index: number, override?: string): string {
	const resolved = override || plugin.meta?.name || plugin.constructor?.name
	if (!resolved || resolved === DEFAULT_PLUGIN_NAME) {
		return `${DEFAULT_PLUGIN_NAME}#${index + 1}`
	}
	return resolved
}

export function normalizePluginEntry(entry: PluginEntry, index: number): NormalizedPluginEntry {
	if (entry && typeof entry === 'object' && 'plugin' in entry) {
		const obj = entry as {
			plugin: IPlugin | Constructor<IPlugin>
			name?: string
			preProcessors?: PluginProcessor[]
			postProcessors?: PluginProcessor[]
		}
		const plugin = resolvePlugin(obj.plugin)
		const name = resolvePluginName(plugin, index, obj.name)
		return {
			plugin,
			name,
			preProcessors: obj.preProcessors ?? [],
			postProcessors: obj.postProcessors ?? []
		}
	}
	const plugin = resolvePlugin(entry as IPlugin | Constructor<IPlugin>)
	return {
		plugin,
		name: resolvePluginName(plugin, index),
		preProcessors: [],
		postProcessors: []
	}
}

export function normalizePluginEntries(plugins: PluginEntry[] | undefined): NormalizedPluginEntry[] {
	return (plugins ?? []).map((entry, index) => normalizePluginEntry(entry, index))
}
