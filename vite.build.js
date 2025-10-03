import { defineConfig } from 'vite';
import { resolve } from 'path';
import { writeFileSync, readFileSync, existsSync, renameSync } from 'fs';
import { minify } from 'terser';

export const moduleBuild = {
	root: process.env.NODE_ENV === 'DEV' ? 'test' : '.',
	build: {
		outDir: 'dist',
		lib: {
			entry: resolve(__dirname, 'src/index.js'),
			name: 'XFramework',
			fileName: () => 'htmlNext.js',
			formats: ['es'],
		},
		// Force full minification for both ES and UMD
		minify: 'terser',
		terserOptions: {
			compress: {
				drop_console: false, // Keep console.log for debugging
				drop_debugger: true,
				pure_funcs: ['console.log'], // Remove console.log in production
			},
			mangle: {
				toplevel: true, // Mangle top-level names
			},
			format: {
				comments: false, // Remove all comments
			},
		},
		cssCodeSplit: false,
		sourcemap: false,
		assetsDir: '',
		rollupOptions: {
			external: [],
			output: {
				globals: {},
				assetFileNames: (assetInfo) => {
					if (assetInfo.name && assetInfo.name.endsWith('.css')) {
						return 'htmlNext.css';
					}
					return assetInfo.name;
				},
			},
		},
	},
	plugins: [
		{
			name: 'generate-types',
			async closeBundle() {
				// Copy TypeScript definitions to dist folder
				const srcTypesPath = resolve(__dirname, 'src/index.d.ts');
				const distTypesPath = resolve(__dirname, 'dist/htmlNext.d.ts');
				
				if (existsSync(srcTypesPath)) {
					const typesContent = readFileSync(srcTypesPath, 'utf8');
					writeFileSync(distTypesPath, typesContent);
					console.log('✅ TypeScript definitions copied to dist/htmlNext.d.ts');
				} else {
					console.warn('⚠️  TypeScript definitions not found at src/index.d.ts');
				}
			},
		},
		{
			name: 'minify-es-module',
			async closeBundle() {
				// Post-process the ES module to fully minify it
				const esModulePath = resolve(__dirname, 'dist/htmlNext.js');
				
				// Check if file exists before trying to read it
				if (!existsSync(esModulePath)) {
					console.warn('⚠️  ES module file not found, skipping minification');
					return;
				}
				
				try {
					const code = readFileSync(esModulePath, 'utf8');

					const result = await minify(code, {
						compress: {
							drop_console: false,
							drop_debugger: true,
							passes: 2, // Multiple passes for better compression
						},
						mangle: {
							toplevel: true,
							properties: {
								regex: /^_/, // Mangle properties starting with _
							},
						},
						format: {
							comments: false,
						},
					});

					if (result.error) {
						console.error('Terser error:', result.error);
					} else {
						writeFileSync(esModulePath, result.code);
						console.log('✅ ES module fully minified');
					}
				} catch (error) {
					console.warn('⚠️  Failed to minify ES module:', error.message);
				}
			},
		},
	],
	optimizeDeps: {
		include: [],
	},
}

// Production configuration: build the library from project root for npm publishing
export default defineConfig(moduleBuild);
