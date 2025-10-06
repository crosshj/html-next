/**
 * Tagged template literal for HTML generation.
 * @param {TemplateStringsArray} strings
 * @param {...any} values
 * @returns {string}
 */
export const html = (strings, ...values) => {
	let result = '';
	for (let i = 0; i < strings.length; i++) {
		result += strings[i];
		if (i < values.length) {
			result += values[i];
		}
	}
	return result;
};

/**
 * Base color definitions for dynamic color generation
 * Only the core colors are defined - shades are generated on the fly
 */
const baseColors = {
	red: '#f44336',
	pink: '#e91e63',
	purple: '#9c27b0',
	deepPurple: '#673ab7',
	indigo: '#3f51b5',
	blue: '#2196f3',
	lightBlue: '#03a9f4',
	cyan: '#00bcd4',
	teal: '#009688',
	green: '#4caf50',
	lightGreen: '#8bc34a',
	lime: '#cddc39',
	yellow: '#ffeb3b',
	amber: '#ffc107',
	orange: '#ff9800',
	deepOrange: '#ff5722',
	brown: '#795548',
	grey: '#9e9e9e',
	blueGrey: '#607d8b',
};

/**
 * Dynamic color generation using color-mix CSS function
 * @param {string} colorName - The color name (e.g., 'green500', 'amber800', 'redA100')
 * @returns {string} - The CSS color-mix value or fallback hex
 */
export const getMixedColor = (colorName) => {
	// Handle accent colors (A100, A200, A400, A700)
	const accentMatch = colorName.match(/^(\w+)(A\d+)$/);
	if (accentMatch) {
		const [, baseColor, accentShade] = accentMatch;
		const baseHex = baseColors[baseColor];
		if (!baseHex) return '#9e9e9e';

		// For accent colors, we'll use a more vibrant mix
		const accentPercentages = { A100: 20, A200: 40, A400: 60, A700: 80 };
		const percentage = accentPercentages[accentShade] || 50;
		return `color-mix(in srgb, ${baseHex} ${percentage}%, white ${
			100 - percentage
		}%)`;
	}

	// Handle regular shades (50-900)
	const shadeMatch = colorName.match(/^([a-zA-Z]+)(\d{2,3})$/);
	if (shadeMatch) {
		const [, baseColor, shade] = shadeMatch;
		const baseHex = baseColors[baseColor];
		if (!baseHex) return '#9e9e9e';

		const shadeNum = parseInt(shade);

		// Handle special cases
		if (shadeNum === 500) {
			return baseHex; // Base color
		}

		// Generate lighter shades (50-400)
		if (shadeNum <= 400) {
			const percentages = { 50: 10, 100: 20, 200: 30, 300: 40, 400: 50 };
			const percentage = percentages[shadeNum] || 50;
			return `color-mix(in srgb, ${baseHex} ${percentage}%, white ${
				100 - percentage
			}%)`;
		}

		// Generate darker shades (600-900)
		if (shadeNum >= 600) {
			const percentages = { 600: 80, 700: 70, 800: 60, 900: 50 };
			const percentage = percentages[shadeNum] || 50;
			return `color-mix(in srgb, ${baseHex} ${percentage}%, black ${
				100 - percentage
			}%)`;
		}
	}

	// Fallback for unrecognized colors
	return '#9e9e9e';
};

/**
 * Legacy function for backward compatibility
 * @deprecated Use getMixedColor instead
 */
export const getColorHex = (colorName) => {
	return getMixedColor(colorName);
};

// Helper functions for conditional rendering
export function parseConditionalValue(value, state) {
	if (typeof value !== 'string') return value;

	// Handle null/undefined state
	if (!state) return value;

	// Check for DEBUG prefix
	const isDebug = value.startsWith('DEBUG ');
	const cleanValue = isDebug ? value.substring(6) : value;

	if (isDebug) {
		console.log('🐛 DEBUG parseConditionalValue:', {
			originalValue: value,
			cleanValue: cleanValue,
			currentState: state,
		});
	}

	// Check if it's a simple comparison (WHEN ... IS ... THEN ... ELSE ...)
	const comparisonMatch = cleanValue.match(
		/^WHEN\s+(.+?)\s+IS\s+(.+?)\s+THEN\s+(.+?)\s+ELSE\s+(.+)$/
	);
	if (comparisonMatch) {
		const [, leftSide, rightSide, thenValue, elseValue] = comparisonMatch;
		const comparisonResult = evaluateComparison(
			leftSide,
			rightSide,
			state,
			isDebug
		);
		const rawResult = comparisonResult ? thenValue : elseValue;
		// Strip quotes from the result
		const result = rawResult.replace(/^['"]|['"]$/g, '');

		if (isDebug) {
			console.log('🐛 DEBUG comparison evaluation:', {
				leftSide,
				rightSide,
				thenValue,
				elseValue,
				comparisonResult,
				rawResult,
				result,
				resolvedValue: result,
			});
		}

		return result;
	}

	// Check if it's a conditional expression (WHEN ... THEN ... ELSE ...)
	const conditionalMatch = cleanValue.match(
		/^WHEN\s+(.+?)\s+THEN\s+(.+?)\s+ELSE\s+(.+)$/
	);
	if (conditionalMatch) {
		const [, condition, thenValue, elseValue] = conditionalMatch;
		const rawResult = evaluateCondition(condition, state)
			? thenValue
			: elseValue;
		// Strip quotes from the result
		const result = rawResult.replace(/^['"]|['"]$/g, '');

		if (isDebug) {
			console.log('🐛 DEBUG conditional evaluation:', {
				condition,
				thenValue,
				elseValue,
				rawResult,
				result,
				conditionResult: evaluateCondition(condition, state),
				resolvedValue: result,
			});
		}

		return result;
	}

	// Check if it's a color token that needs resolution
	const colorHex = getColorHex(cleanValue);
	if (colorHex !== '#9e9e9e' || cleanValue === 'grey500') {
		if (isDebug) {
			console.log('🐛 DEBUG color token resolved:', {
				originalValue: value,
				cleanValue: cleanValue,
				resolvedColor: colorHex,
			});
		}
		return colorHex;
	}

	if (isDebug) {
		console.log(
			'🐛 DEBUG no conditional pattern matched, returning original value'
		);
	}

	return value;
}

function evaluateCondition(condition, state) {
	// Handle null/undefined state
	if (!state) return false;

	// Handle global_ prefixed state references
	const stateRef = condition.trim();
	if (stateRef.startsWith('global_')) {
		const stateKey = stateRef.substring(7);
		return !!state[stateKey];
	}
	return !!state[stateRef];
}

function evaluateComparison(leftSide, rightSide, state, isDebug = false) {
	// Handle null/undefined state
	if (!state) return false;

	// Handle global_ prefixed state references
	const leftValue = leftSide.trim().startsWith('global_')
		? state[leftSide.trim().substring(7)]
		: leftSide.trim();

	// For right side, check if it's a template variable (contains {{}})
	// If so, we can't evaluate it here - return false for now
	// The x-map component should handle this after template processing
	if (rightSide.includes('{{') && rightSide.includes('}}')) {
		if (isDebug) {
			console.log(`⚠️ Template variable detected in comparison: ${rightSide}`);
		}
		return false;
	}

	const rightValue = rightSide.trim().startsWith('global_')
		? state[rightSide.trim().substring(7)]
		: rightSide.trim();

	const result = leftValue === rightValue;

	// Only log comparison details when debug is active
	if (isDebug) {
		console.log(
			`🔍 Comparison: ${leftSide} (${JSON.stringify(
				leftValue
			)}) IS ${rightSide} (${JSON.stringify(rightValue)}) = ${result}`
		);
	}

	return result;
}

export function extractStateReferences(attributes) {
	const stateRefs = new Set();

	Array.from(attributes).forEach((attr) => {
		const value = attr.value;
		const isDebug = value.startsWith('DEBUG ');

		if (isDebug) {
			console.log('🐛 DEBUG extractStateReferences found DEBUG attribute:', {
				attributeName: attr.name,
				attributeValue: value,
				element: attr.ownerElement?.tagName,
			});
		}

		// Find global_ references in the value
		const globalMatches = value.match(/global_(\w+)/g);
		if (globalMatches) {
			// debugger;
			globalMatches.forEach((match) => {
				const stateKey = match.substring(7); // Remove 'global_' prefix
				stateRefs.add(stateKey);

				if (isDebug) {
					console.log('🐛 DEBUG will subscribe to state key:', stateKey);
				}
			});
		}
	});

	return Array.from(stateRefs);
}

// Function to transform x-markdown, x-table, x-schema, and x-form elements to use content attribute
function transformContentElements(htmlContent) {
	// First, temporarily replace markdown code blocks to avoid processing HTML tags inside them
	const codeBlockPlaceholder = '___CODE_BLOCK_PLACEHOLDER___';
	const codeBlockMatches = [];
	let tempContent = htmlContent;

	// Find and replace all markdown code blocks (```...```)
	const codeBlockRegex = /```[\s\S]*?```/g;
	tempContent = tempContent.replace(codeBlockRegex, (match) => {
		const index = codeBlockMatches.length;
		codeBlockMatches.push(match);
		return `${codeBlockPlaceholder}${index}`;
	});

	// Now process x-markdown elements in the content without code blocks
	let transformed = tempContent;
	const openTagRegex = /<x-markdown([^>]*)>/gi;

	let match;
	while ((match = openTagRegex.exec(tempContent)) !== null) {
		const openTag = match[0];
		const attributes = match[1];
		const startIndex = match.index;

		// Find the matching closing tag
		const nextClose = tempContent.indexOf(
			'</x-markdown>',
			startIndex + openTag.length
		);

		if (nextClose === -1) {
			// No closing tag found, skip this one
			continue;
		}

		const content = tempContent.substring(
			startIndex + openTag.length,
			nextClose
		);

		// Escape the content for use in HTML attribute
		const escapedContent = content
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;')
			.replace(/\n/g, '&#10;')
			.replace(/\r/g, '&#13;')
			.replace(/\t/g, '&#9;');

		// Replace this specific match
		const fullMatch = openTag + content + '</x-markdown>';
		const replacement = `<x-markdown${attributes} content="${escapedContent}"></x-markdown>`;
		transformed = transformed.replace(fullMatch, replacement);
	}

	// Restore code blocks
	transformed = transformed.replace(
		new RegExp(`${codeBlockPlaceholder}(\\d+)`, 'g'),
		(match, index) => {
			return codeBlockMatches[parseInt(index)]
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#39;')
				.replace(/\n/g, '&#10;')
				.replace(/\r/g, '&#13;')
				.replace(/\t/g, '&#9;');
		}
	);

	// Match x-table elements with their content (only outside of x-markdown)
	// First, temporarily replace x-markdown content to avoid processing x-table inside it
	const markdownPlaceholder = '___MARKDOWN_PLACEHOLDER___';
	const markdownMatches = [];
	let tableContent = transformed;

	// Store x-markdown elements temporarily
	tableContent = tableContent.replace(
		/<x-markdown[^>]*content="[^"]*"[^>]*><\/x-markdown>/gi,
		(match) => {
			const index = markdownMatches.length;
			markdownMatches.push(match);
			return `${markdownPlaceholder}${index}`;
		}
	);

	// Process x-table elements in the content without x-markdown
	// Transform ALL x-table elements to use content attribute
	const xTableRegex = /<x-table([^>]*)>([\s\S]*?)<\/x-table>/gi;
	tableContent = tableContent.replace(
		xTableRegex,
		(match, attributes, content) => {
			// Escape the content for use in HTML attribute
			const escapedContent = content
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#39;')
				.replace(/\n/g, '&#10;')
				.replace(/\r/g, '&#13;')
				.replace(/\t/g, '&#9;');

			// Return the transformed element with content attribute
			return `<x-table${attributes} content="${escapedContent}"></x-table>`;
		}
	);

	// Restore x-markdown elements
	transformed = tableContent.replace(
		new RegExp(`${markdownPlaceholder}(\\d+)`, 'g'),
		(match, index) => {
			return markdownMatches[parseInt(index)];
		}
	);

	// Process x-schema elements (only outside of x-markdown)
	// First, temporarily replace x-markdown content to avoid processing x-schema inside it
	const schemaMarkdownPlaceholder = '___SCHEMA_MARKDOWN_PLACEHOLDER___';
	const schemaMarkdownMatches = [];
	let schemaContent = transformed;

	// Store x-markdown elements temporarily
	schemaContent = schemaContent.replace(
		/<x-markdown[^>]*content="[^"]*"[^>]*><\/x-markdown>/gi,
		(match) => {
			const index = schemaMarkdownMatches.length;
			schemaMarkdownMatches.push(match);
			return `${schemaMarkdownPlaceholder}${index}`;
		}
	);

	// Process x-schema elements in the content without x-markdown
	const xSchemaRegex = /<x-schema([^>]*)>([\s\S]*?)<\/x-schema>/gi;
	schemaContent = schemaContent.replace(
		xSchemaRegex,
		(match, attributes, content) => {
			// Escape the content for use in HTML attribute
			const escapedContent = content
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#39;')
				.replace(/\n/g, '&#10;')
				.replace(/\r/g, '&#13;')
				.replace(/\t/g, '&#9;');

			// Return the transformed element with content attribute
			return `<x-schema${attributes} content="${escapedContent}"></x-schema>`;
		}
	);

	// Restore x-markdown elements
	transformed = schemaContent.replace(
		new RegExp(`${schemaMarkdownPlaceholder}(\\d+)`, 'g'),
		(match, index) => {
			return schemaMarkdownMatches[parseInt(index)];
		}
	);

	// Process x-form elements (only outside of x-markdown)
	// First, temporarily replace x-markdown content to avoid processing x-form inside it
	const formMarkdownPlaceholder = '___FORM_MARKDOWN_PLACEHOLDER___';
	const formMarkdownMatches = [];
	let formContent = transformed;

	// Store x-markdown elements temporarily
	formContent = formContent.replace(
		/<x-markdown[^>]*content="[^"]*"[^>]*><\/x-markdown>/gi,
		(match) => {
			const index = formMarkdownMatches.length;
			formMarkdownMatches.push(match);
			return `${formMarkdownPlaceholder}${index}`;
		}
	);

	// Process x-form elements in the content without x-markdown
	const xFormRegex = /<x-form([^>]*)>([\s\S]*?)<\/x-form>/gi;
	formContent = formContent.replace(
		xFormRegex,
		(match, attributes, content) => {
			// Escape the content for use in HTML attribute
			const escapedContent = content
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#39;')
				.replace(/\n/g, '&#10;')
				.replace(/\r/g, '&#13;')
				.replace(/\t/g, '&#9;');

			// Return the transformed element with content attribute
			return `<x-form${attributes} content="${escapedContent}"></x-form>`;
		}
	);

	// Restore x-markdown elements
	transformed = formContent.replace(
		new RegExp(`${formMarkdownPlaceholder}(\\d+)`, 'g'),
		(match, index) => {
			return formMarkdownMatches[parseInt(index)];
		}
	);

	return transformed;
}

// Function to clean HTML content from server
export function cleanServerHTML(htmlContent) {
	// Remove Vite's injected script tags
	let cleaned = htmlContent.replace(
		/<script[^>]*type="module"[^>]*>[\s\S]*?<\/script>/gi,
		''
	);

	// Remove any other Vite-related script injections
	cleaned = cleaned.replace(
		/<script[^>]*src="[^"]*vite[^"]*"[^>]*>[\s\S]*?<\/script>/gi,
		''
	);

	// Remove any script tags that might be injected by build tools
	cleaned = cleaned.replace(
		/<script[^>]*src="[^"]*\/src\/[^"]*"[^>]*>[\s\S]*?<\/script>/gi,
		''
	);

	// Remove any link tags that might be injected by build tools
	cleaned = cleaned.replace(/<link[^>]*rel="modulepreload"[^>]*>/gi, '');

	// Clean up any extra whitespace that might be left
	cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');

	// Transform x-markdown elements to use content attribute
	cleaned = transformContentElements(cleaned);

	return cleaned;
}

export const highlightHTMLString = (htmlString, language) => {
	console.log({ language, htmlString });
	//TODO: this should be in a utility
	const escape = (str) =>
		str
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/&/g, '&amp;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;')
			.replace(/\n/g, '&#10;')
			.replace(/\r/g, '&#13;')
			.replace(/\t/g, '&#9;');
	function highlightHTML(str) {
		const tagRe =
			/(\<\/?)([A-Za-z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)*)([\s\S]*?)(\/?\>)/g;
		const attrRe =
			/(\s+[A-Za-z_:]*)(\s*=\s*)(&quot;.*?&quot;|&#39;.*?&#39;|[^\s/&]+)(?=(?:\s|\/?&gt;))/g;

		return str.replace(tagRe, (_, open, tag, rest, close) => {
			const attrs = rest.replace(
				attrRe,
				'<span style="color:red">$1</span>$2<span style="color:green">$3</span>'
			);
			// .replace(
			// 	/(\s+[A-Za-z_:][-A-Za-z0-9:._]*)/g,
			// 	'<span style="color:red">$1</span>'
			// );
			return `${open}<span style="color:blue">${tag}</span>${attrs}${close}`;
		});
	}

	function highlightCSS(str) {
		return str
			.replace(/([a-z-]+)(?=\s*:)/g, '<span style="color:purple">$1</span>')
			.replace(/(:\s*)([^;]+)/g, '$1<span style="color:green">$2</span>');
	}

	function highlightJS(str) {
		return str
			.replace(
				/\b(function|const|let|var|return|if|else)\b/g,
				'<span style="color:blue">$1</span>'
			)
			.replace(/("[^"]*"|'[^']*')/g, '<span style="color:brown">$1</span>');
	}
	const highlighter = {
		html: highlightHTML,
		css: highlightCSS,
		js: highlightJS,
		javascript: highlightJS,
		json: highlightJS,
	}[language];

	if (!highlighter) {
		console.warn(`No highlighter found for language: ${language}`);
		return;
	}

	return highlighter(htmlString);
};
