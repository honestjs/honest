# Components

This directory contains reusable UI components and layout utilities for the Honest framework, primarily focused on
server-side rendering and HTML generation.

## Overview

The components system provides a clean, type-safe way to create reusable UI elements and layouts for web applications
built with Honest. It leverages Hono's JSX capabilities for server-side rendering.

## Files

### `layout.component.ts`

The main layout component that provides a comprehensive HTML document structure with:

- **SEO optimization** with meta tags, Open Graph, and Twitter Card support
- **Flexible configuration** for titles, descriptions, images, and custom metadata
- **Script and stylesheet management** with support for async/defer loading
- **Customizable attributes** for HTML, head, and body elements
- **Content Security Policy** support
- **Favicon handling**

### `index.ts`

Export file that provides access to all components in this directory.

## Usage Examples

### Basic Layout

```typescript
import { Layout } from '@honest/framework'

const html = Layout({
	title: 'My App',
	description: 'A great application',
	children: '<h1>Hello World</h1>'
})
```

### Advanced Layout with SEO

```typescript
import { Layout } from '@honest/framework'

const html = Layout({
	title: 'Product Page',
	description: 'Amazing product details',
	image: 'https://example.com/product.jpg',
	url: 'https://example.com/product',
	siteName: 'My Store',
	twitterCard: 'summary_large_image',
	scripts: [
		{ src: '/app.js', defer: true },
		{ src: '/analytics.js', async: true }
	],
	stylesheets: ['/styles.css'],
	children: '<div>Product content</div>'
})
```

## Features

- **Type-safe props** with comprehensive TypeScript interfaces
- **SEO-friendly** with automatic meta tag generation
- **Responsive design** support with viewport meta tags
- **Performance optimized** with script loading strategies
- **Accessibility ready** with proper HTML structure
- **Customizable** with extensive configuration options

## Component Types

### SiteData Interface

Defines the configuration options for the Layout component:

- `title` - Page title (required)
- `description` - Page description
- `image` - Open Graph and Twitter image URL
- `url` - Canonical URL
- `locale` - Page locale (defaults to 'en_US')
- `type` - Open Graph type (defaults to 'website')
- `siteName` - Site name for Open Graph
- `customMeta` - Array of custom meta tags
- `scripts` - Array of script URLs or objects with loading options
- `stylesheets` - Array of stylesheet URLs
- `favicon` - Favicon URL
- `twitterCard` - Twitter card type
- `csp` - Content Security Policy string
- `htmlAttributes` - Custom HTML attributes
- `headAttributes` - Custom head attributes
- `bodyAttributes` - Custom body attributes

## Best Practices

1. **Always provide a title** - This is required for proper SEO
2. **Use descriptive descriptions** - Help with search engine optimization
3. **Include Open Graph images** - Improve social media sharing
4. **Optimize script loading** - Use async/defer appropriately
5. **Set proper viewport** - Ensures responsive design works correctly
