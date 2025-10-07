import { defineConfig } from 'vite';

// Serve configuration: extends module build with dev server settings
export default defineConfig({
	root: 'demo',
	appType: 'mpa', // Multi-Page Application - return 404 for non-existent files
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
