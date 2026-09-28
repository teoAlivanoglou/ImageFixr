import tailwindcss from '@tailwindcss/vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { paraglide } from '@inlang/paraglide-vite';
import { defineConfig } from 'vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		tailwindcss(),
		svelte(),
		paraglide({
			project: './project.inlang',
			outdir: './src/paraglide'
		})
	],
	resolve: {
		alias: {
			$lib: path.resolve('./src/lib'),
			$paraglide: path.resolve('./src/paraglide')
		}
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (id.includes('node_modules/pixi.js') || id.includes('node_modules/pixi-filters')) {
						return 'pixi';
					}
					if (id.includes('node_modules/bits-ui') || id.includes('node_modules/@lucide')) {
						return 'vendor-ui';
					}
				}
			}
		}
	}
});
