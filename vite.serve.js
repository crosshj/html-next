import { defineConfig } from 'vite';
import { moduleBuild } from './vite.build.js';

// Serve configuration: extends module build with dev server settings
export default defineConfig({
	...moduleBuild,
	server: {
		port: 3000,
		open: false,
	}
});
