import { BaseUIComponent } from './BaseUIComponent.js';
import { getState, Trigger } from '../framework.core.js';
import { unescapeContentAttribute } from '../framework.utils.js';

// Define x-map web component
export class XMap extends BaseUIComponent {
	constructor() {
		super();
		// Add instance tracking for debugging
		if (!XMap.instanceCount) {
			XMap.instanceCount = 0;
		}
		XMap.instanceCount++;
		this.instanceId = XMap.instanceCount;
	}

	connectedCallback() {
		const items = this.getAttribute('items');

		// Check if already processed to prevent multiple renders
		if (this.hasAttribute('data-processed')) {
			return;
		}

		// Mark as processed
		this.setAttribute('data-processed', 'true');

		// Get template from either content attribute or template child
		this.template = this.getTemplate();

		// Clear the initial content since it's just a template
		this.innerHTML = '';

		// Call parent connectedCallback AFTER storing template and clearing content
		// This prevents BaseUIComponent from processing the template elements with {{}} syntax
		super.connectedCallback();

		// Process the data if available
		this.processData(items);
	}

	disconnectedCallback() {
		// Remove event delegation listener
		if (this.selectionMode) {
			this.removeEventListener('click', this.handleSelectionClick);
		}
		super.disconnectedCallback();
	}

	getTemplate() {
		// Check for content attribute first (backward compatibility)
		const contentAttr = this.getAttribute('content');
		if (contentAttr) {
			return contentAttr;
		}

		// Look for template child element
		const templateElement = this.querySelector('template');
		if (templateElement) {
			return templateElement.innerHTML;
		}

		// Fallback to empty string
		return '';
	}

	handleStateChange(newState) {
		// Call parent method first
		super.handleStateChange(newState);

		// Only update template if we don't have one yet (first time)
		if (!this.template) {
			const newTemplate = this.getTemplate();
			if (newTemplate) {
				this.template = newTemplate;
			}
		}

		// Check if selected index changed
		if (this.selectedPath && this.selectionMode) {
			const actualPath = this.selectedPath.startsWith('global_')
				? this.selectedPath.substring(7)
				: this.selectedPath;
			const newSelectedIndex = newState[actualPath];

			// Update wrapper classes
			this.querySelectorAll('div[data-index]').forEach((w) => {
				const wrapperIndex = parseInt(w.dataset.index, 10);
				if (newSelectedIndex === wrapperIndex) {
					w.classList.add('is-selected');
				} else {
					w.classList.remove('is-selected');
				}
			});
		}

		// Re-process data when state changes
		const items = this.getAttribute('items');
		if (items) {
			this.processData(items);
		}
	}

	processData(dataPath) {
		if (!dataPath) {
			console.warn(`x-map #${this.instanceId}: no items attribute provided`);
			return;
		}

		// Get the data from state (BaseUIComponent provides this)
		let actualPath = dataPath;
		if (dataPath.startsWith('global_')) {
			actualPath = dataPath.substring(7); // Remove 'global_' prefix
		}

		const data = getState(actualPath);

		if (!data) {
			console.warn(
				`x-map #${this.instanceId}: data not found for path: ${dataPath} (tried: ${actualPath})`
			);
			return;
		}

		if (!Array.isArray(data)) {
			console.warn(
				`x-map #${this.instanceId}: data is not an array: ${dataPath}`
			);
			return;
		}

		// Clear any previous content (idempotent behavior)
		this.innerHTML = '';

		// Get selection mode and callbacks
		const selectMode = this.getAttribute('selectMode');
		const selectedPath = this.getAttribute('selected');
		const onSelectHandler = this.getAttribute('onSelect');

		this.selectionMode = selectMode;
		this.selectedPath = selectedPath;
		this.onSelectHandler = onSelectHandler;

		// Add event delegation listener if selection is enabled
		if (selectMode) {
			this.addEventListener('click', this.handleSelectionClick);
		}

		// Create actual web component instances instead of HTML strings
		data.forEach((item, index) => {
			const processedTemplate = this.processTemplate(
				this.template,
				item,
				index
			);

			// Create a temporary container to parse the HTML
			const tempDiv = document.createElement('div');
			tempDiv.innerHTML = processedTemplate;

			// Wrap in clickable container if selection is enabled
			if (selectMode) {
				const wrapper = document.createElement('div');
				wrapper.dataset.index = index;

				// Add class based on selected index
				if (selectedPath) {
					const selectedIndex = getState(
						selectedPath.startsWith('global_')
							? selectedPath.substring(7)
							: selectedPath
					);
					if (selectedIndex === index) {
						wrapper.classList.add('is-selected');
					}
				} else if (item.isSelected) {
					// Fallback: check item.isSelected property
					wrapper.classList.add('is-selected');
				}

				// Move all child nodes to the wrapper
				while (tempDiv.firstChild) {
					wrapper.appendChild(tempDiv.firstChild);
				}

				this.appendChild(wrapper);
			} else {
				// No selection, just append normally
				while (tempDiv.firstChild) {
					this.appendChild(tempDiv.firstChild);
				}
			}
		});

		// Show the component now that it has content
		this.style.removeProperty('display');
	}

	processTemplate(template, item, index) {
		// Only unescape if template comes from content attribute (not from <template> element)
		// Check if template contains HTML entities that need unescaping
		const needsUnescaping =
			template.includes('&lt;') ||
			template.includes('&gt;') ||
			template.includes('&quot;');
		let processedTemplate = needsUnescaping
			? unescapeContentAttribute(template)
			: template;

		// Replace template variables with item data
		// Handle {{item_property}} and {{ item_property }} syntax (with or without spaces)
		processedTemplate = processedTemplate.replace(
			/\{\{\s*item_([^}]+)\s*\}\}/g,
			(match, property) => {
				// Trim any whitespace from the property name
				const cleanProperty = property.trim();
				const value = item[cleanProperty] || '';
				return value;
			}
		);

		// Handle {{item}} - stringify objects/arrays, otherwise use String()
		processedTemplate = processedTemplate.replace(/\{\{\s*item\s*\}\}/g, () => {
			if (item === undefined || item === null) return '';
			if (typeof item === 'object') {
				// Escape the JSON string for safe use in HTML attributes
				return JSON.stringify(item).replace(/"/g, '&quot;');
			}
			return String(item);
		});

		// Handle {{index}} for array index (1-based)
		processedTemplate = processedTemplate.replace(/\{\{index\}\}/g, index + 1);

		// Process {{#if}} conditionals
		processedTemplate = processedTemplate.replace(
			/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
			(match, condition, content) => {
				// Evaluate the condition
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

		// Process conditional classes after template variables are replaced
		// This is handled by BaseUIComponent's conditional attribute processing
		// but we need to process it here since we're creating HTML strings
		processedTemplate = processedTemplate.replace(
			/class="WHEN\s+(.+?)\s+IS\s+(.+?)\s+THEN\s+(.+?)\s+ELSE\s+(.+?)"/g,
			(match, leftSide, rightSide, thenValue, elseValue) => {
				// Use the current state from BaseUIComponent
				const state = this.initialState || {};

				// Evaluate the comparison
				const leftValue = leftSide.trim().startsWith('global_')
					? state[leftSide.trim().substring(7)]
					: leftSide.trim();

				let rightValue = rightSide.trim();

				const result = leftValue === rightValue;
				// Strip quotes from the values and use the result
				const cleanThenValue = thenValue.replace(/^['"]|['"]$/g, '');
				const cleanElseValue = elseValue.replace(/^['"]|['"]$/g, '');
				const className = result ? cleanThenValue : cleanElseValue;

				return `class="${className}"`;
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

	handleSelectionClick = (event) => {
		// Find the wrapper div that was clicked
		const wrapper = event.target.closest('div[data-index]');
		if (!wrapper) return;

		const index = parseInt(wrapper.dataset.index, 10);

		if (this.selectionMode === 'single') {
			// Remove is-selected class from all wrappers
			this.querySelectorAll('div[data-index]').forEach((w) => {
				w.classList.remove('is-selected');
			});
			// Add class to clicked item
			wrapper.classList.add('is-selected');
		} else {
			// Just toggle clicked item
			wrapper.classList.toggle('is-selected');
		}

		// Trigger flow handler if provided
		if (this.onSelectHandler) {
			Trigger(
				this.onSelectHandler,
				{ index },
				{ triggeredBy: 'x-map', element: wrapper }
			);
		}
	};
}
