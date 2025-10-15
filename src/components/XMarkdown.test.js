import { readFileSync } from 'fs';
import { jest } from '@jest/globals';
import {
	dedentContent,
	unescapeHtmlEntities,
	parseWithCustomRenderer,
} from './XMarkdown.js';

describe('XMarkdown Component', () => {
	test('processes markdown_process.complex.txt correctly', () => {
		const input = readFileSync(
			'src/__fixtures/markdown_process.complex.txt',
			'utf8'
		);
		const expected = readFileSync(
			'src/__fixtures/markdown_process.complex.output.txt',
			'utf8'
		);

		// Test the full pipeline: dedent -> unescape -> parse
		const dedented = dedentContent(input);
		const unescaped = unescapeHtmlEntities(dedented);
		const result = parseWithCustomRenderer(unescaped);

		expect(result).toBe(expected);
	});
});
