// @ts-check

import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

const mathRemarkPlugins = [remarkMath];
const mathRehypePlugins = [rehypeKatex];

// https://astro.build/config
export default defineConfig({
	site: 'https://bhaskar-jain.vercel.app',
	markdown: {
		remarkPlugins: mathRemarkPlugins,
		rehypePlugins: mathRehypePlugins,
	},
	integrations: [
		react(),
		mdx({
			remarkPlugins: mathRemarkPlugins,
			rehypePlugins: mathRehypePlugins,
		}),
		sitemap(),
	],
	redirects: {
		'/about': '/projects',
	},
});
