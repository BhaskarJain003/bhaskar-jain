// @ts-check

import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

// https://astro.build/config
export default defineConfig({
	site: 'https://bhaskar-jain.vercel.app',
	markdown: {
		remarkPlugins: [remarkMath],
		rehypePlugins: [rehypeKatex],
	},
	integrations: [
		react(),
		mdx({
			remarkPlugins: [remarkMath],
			rehypePlugins: [rehypeKatex],
		}),
		sitemap(),
	],
	redirects: {
		'/about': '/projects',
	},
	vite: {
		optimizeDeps: {
			// Pre-bundle @observablehq/plot at startup so Vite doesn't trigger
			// a mid-session re-optimisation (which causes a plugin-container
			// crash on the next module transform request).
			include: ['@observablehq/plot'],
		},
	},
});
