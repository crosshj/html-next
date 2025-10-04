import { defineConfig } from 'vite';

// Serve configuration: extends module build with dev server settings
export default defineConfig({
	root: 'demo',
	server: {
		port: 3000,
		open: false,
		watch: {
			// include: ['**/dist/**'],
			ignored: ['!**/dist/**'],
			// usePolling: true,
		},
	},
});
