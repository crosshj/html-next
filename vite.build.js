import { defineConfig } from 'vite';
import { resolve } from 'path';
import { writeFileSync, readFileSync, existsSync, renameSync } from 'fs';
import { minify } from 'terser';

if (process.env.NODE_ENV === 'DEV') {
	console.log('🔴 DEV MODE');
} else {
	console.log('🟢 PROD MODE');
}

export const moduleBuild = {
	root: process.env.NODE_ENV === 'DEV' ? 'demo' : '.',
	build: {
		outDir: 'dist',
		lib: {
			entry: {
				htmlNext: resolve(__dirname, 'src/index.js'),
				'htmlNext.helpers': resolve(__dirname, 'src/helpers/helpers.js'),
			},
			name: 'XFramework',
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
				entryFileNames: (chunkInfo) => {
					// Keep the original names for both entries
					return '[name].js';
				},
				// Prevent code splitting for cleaner output
				manualChunks: undefined,
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
				const typeFiles = [
					{ src: 'index.d.ts', dest: 'htmlNext.d.ts' },
					{ src: 'helpers/helpers.d.ts', dest: 'htmlNext.helpers.d.ts' },
				];

				for (const { src, dest } of typeFiles) {
					const srcTypesPath = resolve(__dirname, 'src', src);
					const distTypesPath = resolve(
						__dirname,
						moduleBuild.root,
						moduleBuild.build.outDir,
						dest
					);

					if (existsSync(srcTypesPath)) {
						const typesContent = readFileSync(srcTypesPath, 'utf8');
						writeFileSync(distTypesPath, typesContent);
						console.log(
							`✅ TypeScript definitions copied to ${moduleBuild.root}/${moduleBuild.build.outDir}/${dest}`
						);
					} else {
						console.warn(`⚠️  TypeScript definitions not found at src/${src}`);
					}
				}
			},
		},
		{
			name: 'minify-es-module',
			async closeBundle() {
				// Post-process both ES modules to fully minify them
				const filesToMinify = ['htmlNext.js', 'htmlNext.helpers.js'];

				for (const fileName of filesToMinify) {
					const filePath = resolve(
						__dirname,
						moduleBuild.root,
						moduleBuild.build.outDir,
						fileName
					);

					// Check if file exists before trying to read it
					if (!existsSync(filePath)) {
						console.warn(`⚠️  ${fileName} not found, skipping minification`);
						continue;
					}

					try {
						const code = readFileSync(filePath, 'utf8');

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
							console.error(`Terser error for ${fileName}:`, result.error);
						} else {
							writeFileSync(filePath, result.code);
							console.log(`✅ ${fileName} fully minified`);
						}
					} catch (error) {
						console.warn(`⚠️  Failed to minify ${fileName}:`, error.message);
					}
				}
			},
		},
	],
	optimizeDeps: {
		include: [],
	},
};

// Production configuration: build the library from project root for npm publishing
export default defineConfig(moduleBuild);
