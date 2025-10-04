/**
 * @jest-environment jsdom
 */

import { BaseUIComponent } from './BaseUIComponent.js';

// Create a test component that extends BaseUIComponent
class TestComponent extends BaseUIComponent {
	constructor() {
		super();
	}
}

// Register the custom element for testing
customElements.define('test-component', TestComponent);

describe('BaseUIComponent', () => {
	let expand;

	beforeAll(() => {
		// Extract the static function for cleaner test calls
		expand = BaseUIComponent.prototype.expandShorthandProperty;
	});

	describe('expandShorthandProperty', () => {
		test('bg becomes background-color', () => {
			const result = expand('bg', 'blue200');
			expect(result).toEqual({ 'background-color': 'blue200' });
		});

		test('p with number gets MUI spacing', () => {
			const result = expand('p', '2');
			expect(result).toEqual({ padding: '16px' });
		});

		test('values with px units are not transformed', () => {
			const result = expand('gap', '8px');
			expect(result).toEqual({ gap: '8px' });
		});

		test('values with % units are not transformed', () => {
			const result = expand('width', '50%');
			expect(result).toEqual({ width: '50%' });
		});
	});

	describe('DOM Integration', () => {
		let container;

		beforeEach(() => {
			// Create a container for our tests
			container = document.createElement('div');
			document.body.appendChild(container);
		});

		afterEach(() => {
			// Clean up after each test
			if (container && container.parentNode) {
				container.parentNode.removeChild(container);
			}
		});

		test('flexDirection attribute actually applies to DOM element', async () => {
			// Create element with flexDirection attribute
			container.innerHTML = `
				<test-component 
					sx:display="flex" 
					sx:flex-direction="column"
				></test-component>
			`;

			const element = container.querySelector('test-component');

			// Wait for the element to be fully connected and processed
			await new Promise((resolve) => setTimeout(resolve, 10));

			// Check that the styles were actually applied to the DOM
			const computedStyle = window.getComputedStyle(element);
			expect(computedStyle.display).toBe('flex');
			expect(computedStyle.flexDirection).toBe('column');

			// Also check the style attribute directly
			expect(element.style.display).toBe('flex');
			expect(element.style.flexDirection).toBe('column');
		});

		test('bg shorthand actually applies to DOM element', async () => {
			container.innerHTML = `
				<test-component sx:bg="red"></test-component>
			`;

			const element = container.querySelector('test-component');

			// Wait for processing
			await new Promise((resolve) => setTimeout(resolve, 10));

			// Check that bg was expanded to background-color
			expect(element.style.backgroundColor).toBe('red');
		});

		test('MUI spacing actually applies to DOM element', async () => {
			container.innerHTML = `
				<test-component sx:p="2"></test-component>
			`;

			const element = container.querySelector('test-component');

			// Wait for processing
			await new Promise((resolve) => setTimeout(resolve, 10));

			// Check that MUI spacing was applied (2 * 8px = 16px)
			expect(element.style.padding).toBe('16px');
		});

		test('comprehensive kebab-case properties work in DOM', async () => {
			container.innerHTML = `
				<test-component 
					sx:display="flex"
					sx:flex-direction="column"
					sx:align-items="center"
					sx:justify-content="space-between"
					sx:border-radius="8px"
					sx:box-shadow="0 2px 4px rgba(0,0,0,0.1)"
				></test-component>
			`;

			const element = container.querySelector('test-component');

			// Wait for processing
			await new Promise((resolve) => setTimeout(resolve, 10));

			// Check that all kebab-case properties were applied correctly
			expect(element.style.display).toBe('flex');
			expect(element.style.flexDirection).toBe('column');
			expect(element.style.alignItems).toBe('center');
			expect(element.style.justifyContent).toBe('space-between');
			expect(element.style.borderRadius).toBe('8px');
			expect(element.style.boxShadow).toBe('0 2px 4px rgba(0,0,0,0.1)');
		});
	});
});
