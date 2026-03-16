import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { defineConfig } from 'vite';

import pkg from './package.json';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			strategy: ['localStorage', 'baseLocale']
		})
	],
	define: {
		__BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
		__APP_VERSION__: JSON.stringify(pkg.version)
	}
});
