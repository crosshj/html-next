import { readFileSync } from 'fs';
import { jest } from '@jest/globals';
import {
	dedentContent,
	unescapeHtmlEntities,
	parseWithCustomRenderer,
} from './XMarkdown.js';
import {
	transformContentElements,
	unescapeContentAttribute,
} from '../framework.utils.js';

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

	test('demonstrates auto-conversion to template-based approach works correctly', () => {
		// Test that x-map elements are automatically converted to template-based
		const input = `<x-markdown>
## Usage

\`\`\`html
<x-map items="global_userList">
	<x-box>{{item_name}} - {{item_email}}</x-box>
</x-map>
\`\`\`

<x-map items="global_userList">
	<x-box>{{item_name}} - {{item_email}}</x-box>
</x-map>
</x-markdown>`;

		// Step 1: Run through transformContentElements (pre-processing step)
		const transformed = transformContentElements(input);

		// Step 2: Extract the content attribute from x-markdown (simulates what XMarkdown component gets)
		const contentMatch = transformed.match(
			/<x-markdown[^>]*content="([^"]*)"[^>]*><\/x-markdown>/
		);
		expect(contentMatch).toBeTruthy();
		const contentAttribute = contentMatch[1];

		// Step 3: Check that x-map elements were auto-converted to template-based
		expect(contentAttribute).toContain('&lt;template&gt;'); // Escaped in content attribute
		expect(contentAttribute).toContain('{{item_name}} - {{item_email}}');
		expect(contentAttribute).not.toContain('content=');

		// Step 4: Simulate what XMarkdown does - unescape content attribute
		const unescapedContent = unescapeContentAttribute(contentAttribute);

		// Step 5: Simulate the full XMarkdown rendering process
		// This is what XMarkdown.renderMarkdown() does:
		const dedentedContent = dedentContent(unescapedContent);
		const unescapedHtmlEntities = unescapeHtmlEntities(dedentedContent);
		const finalHtml = parseWithCustomRenderer(unescapedHtmlEntities);

		// Step 6: Check that x-map elements with template children are preserved correctly
		const xMapElements = finalHtml.match(/<x-map[^>]*>/g) || [];
		expect(xMapElements.length).toBeGreaterThan(0);

		// The x-map elements should have template children, not content attributes
		const xMapElementsWithTemplate =
			finalHtml.match(
				/<x-map[^>]*>[\s\S]*?<template>[\s\S]*?<\/template>[\s\S]*?<\/x-map>/g
			) || [];
		expect(xMapElementsWithTemplate.length).toBeGreaterThan(0);

		// Template content should be properly preserved
		expect(finalHtml).toContain('<template>');
		expect(finalHtml).toContain('{{item_name}} - {{item_email}}');
	});
});
