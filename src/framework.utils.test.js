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
	test('round-trip: markdown content', () => {
		const fixture = loadFixture('markdown-content');

		// Step 1: Encode (transform to content-based)
		const encoded = transformContentElements(fixture.input);
		expect(encoded).toBe(fixture.encoded);

		// Step 2: Decode (unescape for rendering)
		const decoded = unescapeContentAttribute(encoded);
		expect(decoded).toBe(fixture.decoded);
	});

	test('round-trip: x-map with nested content', () => {
		const fixture = loadFixture('x-map-nested');

		// Step 1: Encode
		const encoded = transformContentElements(fixture.input);
		expect(encoded).toBe(fixture.encoded);

		// Step 2: Decode
		const decoded = unescapeContentAttribute(encoded);
		expect(decoded).toBe(fixture.decoded);
	});

	test('round-trip: complex nested structure', () => {
		const fixture = loadFixture('complex-nested');

		// Step 1: Encode
		const encoded = transformContentElements(fixture.input);
		expect(encoded).toBe(fixture.encoded);

		// Step 2: Decode
		const decoded = unescapeContentAttribute(encoded);
		expect(decoded).toBe(fixture.decoded);
	});

	test('round-trip: preserves HTML attributes during decode', () => {
		const fixture = loadFixture('preserves-html-attributes');

		// Decode should unescape text but preserve attribute content
		const decoded = unescapeContentAttribute(fixture.input);
		expect(decoded).toBe(fixture.decoded);
	});

	test('handles empty input', () => {
		expect(transformContentElements('')).toBe('');
		expect(unescapeContentAttribute('')).toBe('');
		expect(unescapeContentAttribute(null)).toBe('');
	});

	test('simulates demo page scenario: x-map in markdown should render output', () => {
		const fixture = loadFixture('demo-page-scenario');

		// Step 1: Transform as x-fragment would (cleanServerHTML calls transformContentElements)
		const preprocessed = cleanServerHTML(fixture.input);
		expect(preprocessed).toBe(fixture.encoded);

		// Step 2: Extract the content attribute from x-markdown element
		const markdownMatch = preprocessed.match(
			/<x-markdown[^>]*content="([^"]*)"[^>]*><\/x-markdown>/
		);
		expect(markdownMatch).toBeTruthy();
		const markdownContent = markdownMatch[1];

		// Step 3: Unescape the content attribute as x-markdown would
		const unescapedContent = unescapeContentAttribute(markdownContent);
		expect(unescapedContent).toBe(fixture.decoded);
	});
});
