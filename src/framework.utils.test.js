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

	// Complex scenarios using snapshots for better maintainability
	test('transforms complex nested x-map scenario', () => {
		const input = readFileSync(
			join(__dirname, '__fixtures', 'complex-nested-xmarkdown.input.txt'),
			'utf8'
		);
		const result = transformContentElements(input);
		expect(result).toMatchSnapshot();
	});

	test('transforms demo page scenario with mixed content', () => {
		const input = readFileSync(
			join(__dirname, '__fixtures', 'demo-page-scenario.input.txt'),
			'utf8'
		);
		const result = transformContentElements(input);
		expect(result).toMatchSnapshot();
	});

	test('preserves HTML attributes with content transformation', () => {
		const input = readFileSync(
			join(__dirname, '__fixtures', 'preserves-html-attributes.input.txt'),
			'utf8'
		);
		const result = transformContentElements(input);
		expect(result).toMatchSnapshot();
	});

	test('handles nested x-map scenarios', () => {
		const input = readFileSync(
			join(__dirname, '__fixtures', 'nested-xmap-scenario.input.txt'),
			'utf8'
		);
		const result = transformContentElements(input);
		expect(result).toMatchSnapshot();
	});

	test('unescapeContentAttribute handles complex HTML entities', () => {
		const input = readFileSync(
			join(__dirname, '__fixtures', 'complex-html-entities.input.txt'),
			'utf8'
		);
		const result = unescapeContentAttribute(input);
		expect(result).toMatchSnapshot();
	});

	test('cleanServerHTML removes build artifacts', () => {
		const input = readFileSync(
			join(__dirname, '__fixtures', 'server-html-cleanup.input.txt'),
			'utf8'
		);
		const result = cleanServerHTML(input);
		expect(result).toMatchSnapshot();
	});
});
