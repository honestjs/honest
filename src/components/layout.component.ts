import { html, raw } from 'hono/html'
import type { PropsWithChildren } from 'hono/jsx'

export type HtmlAttributes = Record<string, string | number | boolean>

export interface MetaTag {
	property: string
	content: string
	name?: string
	prefix?: string
}

export interface SiteData {
	title: string
	description?: string
	image?: string
	url?: string
	locale?: string
	type?: string
	siteName?: string
	customMeta?: MetaTag[]
	scripts?: (string | { src: string; async?: boolean; defer?: boolean })[]
	stylesheets?: string[]
	favicon?: string
	twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player'
	csp?: string
	htmlAttributes?: HtmlAttributes
	headAttributes?: HtmlAttributes
	bodyAttributes?: HtmlAttributes
}

const defaultSiteData: Partial<SiteData> = {
	type: 'website',
	locale: 'en_US'
}

const attrsToString = (attrs: HtmlAttributes | undefined): string => {
	if (!attrs) {
		return ''
	}
	return Object.entries(attrs)
		.map(([key, value]) => {
			if (typeof value === 'boolean') {
				return value ? key : ''
			}
			const escapedValue = String(value).replace(/"/g, '&quot;')
			return `${key}="${escapedValue}"`
		})
		.filter(Boolean)
		.join(' ')
}

export const Layout = (props: PropsWithChildren<SiteData>) => {
	const data = { ...defaultSiteData, ...props }

	return html`
		<!DOCTYPE html>
		<html lang="${data.locale?.split('_')[0] || 'en'}" ${raw(attrsToString(data.htmlAttributes))}>
			<head ${raw(attrsToString(data.headAttributes))}>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				${data.csp ? html`<meta http-equiv="Content-Security-Policy" content="${data.csp}" />` : ''}
				<title>${data.title}</title>
				${data.description ? html`<meta name="description" content="${data.description}" />` : ''}

				<!-- Open Graph / Facebook -->
				<meta prefix="og: http://ogp.me/ns#" />
				<meta property="og:title" content="${data.title}" />
				${data.description ? html`<meta property="og:description" content="${data.description}" />` : ''}
				${data.image ? html`<meta property="og:image" content="${data.image}" />` : ''}
				${data.url ? html`<meta property="og:url" content="${data.url}" />` : ''}
				${data.locale ? html`<meta property="og:locale" content="${data.locale}" />` : ''}
				${data.type ? html`<meta property="og:type" content="${data.type}" />` : ''}
				${data.siteName ? html`<meta property="og:site_name" content="${data.siteName}" />` : ''}

				<!-- Twitter -->
				<meta
					name="twitter:card"
					content="${data.twitterCard || (data.image ? 'summary_large_image' : 'summary')}"
				/>
				<meta name="twitter:title" content="${data.title}" />
				${data.description ? html`<meta name="twitter:description" content="${data.description}" />` : ''}
				${data.image ? html`<meta name="twitter:image" content="${data.image}" />` : ''}

				<!-- Custom Meta Tags -->
				${data.customMeta
					? data.customMeta.map((meta) => {
							const nameAttr = meta.name ? `name="${meta.name}"` : ''
							const propertyAttr = meta.property ? `property="${meta.property}"` : ''
							return html`<meta ${nameAttr} ${propertyAttr} content="${meta.content}" />`
						})
					: ''}

				<!-- Favicon -->
				${data.favicon ? html`<link rel="icon" href="${data.favicon}" />` : ''}

				<!-- Stylesheets -->
				${data.stylesheets
					? data.stylesheets.map((href) => html`<link rel="stylesheet" href="${href}" />`)
					: ''}

				<!-- Scripts -->
				${data.scripts
					? data.scripts.map((script) => {
							if (typeof script === 'string') {
								return html`<script src="${script}"></script>`
							}
							const { src, async, defer } = script
							if (async && defer) {
								return html`<script src="${src}" async defer></script>`
							}
							if (async) {
								return html`<script src="${src}" async></script>`
							}
							if (defer) {
								return html`<script src="${src}" defer></script>`
							}
							return html`<script src="${src}"></script>`
						})
					: ''}
			</head>
			<body ${raw(attrsToString(data.bodyAttributes))}>
				${data.children}
			</body>
		</html>
	`
}
