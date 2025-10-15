import {
	transformContentElements,
	unescapeContentAttribute,
	cleanServerHTML,
} from './framework.utils.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper function to load test fixtures
const loadFixture = (name) => {
	const inputPath = join(__dirname, '__fixtures', `${name}.input.txt`);
	const encodedPath = join(__dirname, '__fixtures', `${name}.encoded.txt`);
	const decodedPath = join(__dirname, '__fixtures', `${name}.decoded.txt`);

	return {
		input: readFileSync(inputPath, 'utf8'),
		encoded: readFileSync(encodedPath, 'utf8'),
		decoded: readFileSync(decodedPath, 'utf8'),
	};
};

describe('Content encoding/decoding pipeline', () => {
	test('transformContentElements handles basic markdown', () => {
		const input =
			'<x-markdown># Title\n\nParagraph with **bold** text</x-markdown>';
		const result = transformContentElements(input);
		expect(result).toContain('content=');
		expect(result).toContain('# Title');
	});

	test('transformContentElements converts x-map to template-based', () => {
		const input = '<x-map items="list"><div>{{item}}</div></x-map>';
		const result = transformContentElements(input);
		expect(result).toContain('<template>');
		expect(result).toContain('{{item}}');
		expect(result).not.toContain('content=');
	});

	test('transformContentElements preserves existing template-based x-map', () => {
		const input =
			'<x-map items="list"><template><div>{{item}}</div></template></x-map>';
		const result = transformContentElements(input);
		// Already template-based: should be preserved as-is
		expect(result).toBe(input);
	});

	test('unescapeContentAttribute unescapes HTML entities', () => {
		const input = '&lt;div&gt;{{item}}&lt;/div&gt;';
		const result = unescapeContentAttribute(input);
		expect(result).toBe('<div>{{item}}</div>');
	});

	test('handles empty input', () => {
		expect(transformContentElements('')).toBe('');
		expect(unescapeContentAttribute('')).toBe('');
		expect(unescapeContentAttribute(null)).toBe('');
	});
});
