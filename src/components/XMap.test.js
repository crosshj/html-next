import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple test to verify template processing works
describe('XMap Template Processing', () => {
	// Create a minimal XMap instance for testing template processing
	class TestXMap {
		processTemplate(template, item, index) {
			// Replace template variables with item data
			let processedTemplate = template.replace(
				/\{\{\s*item_([^}]+)\s*\}\}/g,
				(match, property) => {
					const cleanProperty = property.trim();
					const value = item[cleanProperty] || '';
					return value;
				}
			);

			// Handle {{item}} for primitive array items
			processedTemplate = processedTemplate.replace(/\{\{\s*item\s*\}\}/g, () =>
				item !== undefined && item !== null ? String(item) : ''
			);

			// Handle {{index}} for array index (1-based)
			processedTemplate = processedTemplate.replace(
				/\{\{index\}\}/g,
				index + 1
			);

			// Process {{#if}} conditionals
			processedTemplate = processedTemplate.replace(
				/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
				(match, condition, content) => {
					const conditionValue = this.evaluateCondition(condition.trim(), item);
					return conditionValue ? content : '';
				}
			);

			// Process {{#each}} loops
			processedTemplate = processedTemplate.replace(
				/\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
				(match, arrayProperty, content) => {
					const property = arrayProperty.trim();
					let arrayValue;

					// Handle item_property syntax
					if (property.startsWith('item_')) {
						const prop = property.substring(5);
						arrayValue = item[prop];
					} else {
						arrayValue = item[property];
					}

					if (!Array.isArray(arrayValue)) {
						return '';
					}

					// Process each item in the array
					return arrayValue
						.map((arrayItem, index) => {
							// Replace {{ this }} with the current array item
							let processedContent = content.replace(
								/\{\{\s*this\s*\}\}/g,
								arrayItem
							);
							// Process any other template variables in the content
							return this.processTemplate(processedContent, arrayItem, index);
						})
						.join('');
				}
			);

			return processedTemplate;
		}

		evaluateCondition(condition, item) {
			// Handle simple property checks like "item_listItems"
			if (condition.startsWith('item_')) {
				const property = condition.substring(5); // Remove "item_" prefix
				const value = item[property];

				// Check if it's truthy (exists and not empty)
				if (Array.isArray(value)) {
					return value.length > 0;
				}
				return !!value;
			}

			// Handle direct property checks
			const value = item[condition];
			if (Array.isArray(value)) {
				return value.length > 0;
			}
			return !!value;
		}
	}

	let xMap;

	beforeEach(() => {
		xMap = new TestXMap();
	});

	describe('Template processing', () => {
		test('should process template variables correctly', () => {
			const item = { name: 'John Doe', email: 'john.doe@example.com' };
			const template = '<x-box>{{item_name}} - {{item_email}}</x-box>';

			const result = xMap.processTemplate(template, item, 0);
			expect(result).toBe('<x-box>John Doe - john.doe@example.com</x-box>');
		});

		test('should handle index variable (1-based)', () => {
			const item = { name: 'John Doe', email: 'john.doe@example.com' };
			const template = '<x-box>{{index}}: {{item_name}}</x-box>';

			// Test first item (array index 0, display index 1)
			const result1 = xMap.processTemplate(template, item, 0);
			expect(result1).toBe('<x-box>1: John Doe</x-box>');

			// Test fifth item (array index 5, display index 6)
			const result2 = xMap.processTemplate(template, item, 5);
			expect(result2).toBe('<x-box>6: John Doe</x-box>');
		});

		test('should handle conditional rendering', () => {
			const item = {
				name: 'John Doe',
				email: 'john.doe@example.com',
				isActive: true,
			};
			const template =
				'{{#if item_isActive}}<x-box>Active: {{item_name}}</x-box>{{/if}}';

			const result = xMap.processTemplate(template, item, 0);
			expect(result).toBe('<x-box>Active: John Doe</x-box>');
		});

		test('should handle each loops', () => {
			const item = { name: 'John Doe', skills: ['JavaScript', 'React'] };
			const template = '{{#each item_skills}}<x-box>{{this}}</x-box>{{/each}}';

			const result = xMap.processTemplate(template, item, 0);
			expect(result).toBe('<x-box>JavaScript</x-box><x-box>React</x-box>');
		});

		test('should handle complex nested scenarios', () => {
			const item = {
				name: 'John Doe',
				email: 'john@example.com',
				departments: [
					{ name: 'Engineering', role: 'Senior Developer' },
					{ name: 'Product', role: 'Tech Lead' },
				],
				isActive: true,
			};
			const template = readFileSync(
				join(__dirname, '..', '__fixtures', 'complex-template.input.txt'),
				'utf8'
			);

			const result = xMap.processTemplate(template, item, 0);
			expect(result).toMatchSnapshot();
		});
	});
});
