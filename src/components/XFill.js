import { BaseUIComponent } from './BaseUIComponent.js';
import { getState } from '../framework.core.js';

// Define x-fill web component
export class XFill extends BaseUIComponent {
	constructor() {
		super();
	}

	connectedCallback() {
		// Call parent connectedCallback first to handle sx: styles and state subscriptions
		super.connectedCallback();

		// Initialize template and render initial content
		this.initializeTemplate();
		this.renderContent();
	}

	/**
	 * Hook method called after BaseUIComponent processes state changes
	 * This allows us to re-render when the item data changes
	 */
	onStateChange(newState) {
		// Re-render content when state changes
		this.renderContent();
	}

	initializeTemplate() {
		const templateId = this.getAttribute('template');
		if (!templateId) {
			console.warn('x-fill: no template attribute provided');
			return;
		}

		// Get template element
		const templateElement = document.getElementById(templateId);
		if (!templateElement) {
			console.warn(
				`x-fill: template element with id "${templateId}" not found`
			);
			return;
		}

		// Store template content
		this.template = templateElement.innerHTML;
	}

	getItemPath() {
		const itemPath = this.getAttribute('item');
		if (!itemPath) {
			console.warn('x-fill: no item attribute provided');
			return null;
		}

		// Check if itemPath is JSON (from x-map processing)
		if (itemPath.trim().startsWith('{') || itemPath.trim().startsWith('[')) {
			return null; // Signal that we should parse the JSON directly
		}

		// Remove global_ prefix if present
		return itemPath.startsWith('global_') ? itemPath.substring(7) : itemPath;
	}

	getItemFromState() {
		const actualPath = this.getItemPath();
		if (!actualPath) return null;

		return getState(actualPath);
	}

	renderContent() {
		const actualPath = this.getItemPath();

		// Get item - either from JSON in the attribute or from state
		let item;
		if (actualPath === null) {
			// Item is JSON string from x-map (unescape HTML entities first)
			const itemPath = this.getAttribute('item');
			try {
				const unescaped = itemPath.replace(/&quot;/g, '"');
				item = JSON.parse(unescaped);
			} catch (e) {
				console.error('x-fill: failed to parse item JSON:', e);
				return;
			}
		} else {
			// Item is a state reference
			item = getState(actualPath);
		}

		if (!item) {
			console.warn('x-fill: item is null or undefined');
			this.innerHTML = '';
			return;
		}

		if (!this.template) {
			return;
		}

		// Process the template to replace template variables
		const processedTemplate = this.processTemplate(this.template, item);

		// Create a temporary container to parse the HTML
		const tempDiv = document.createElement('div');
		tempDiv.innerHTML = processedTemplate;

		// Clear and populate the x-fill element
		this.innerHTML = '';
		while (tempDiv.firstChild) {
			this.appendChild(tempDiv.firstChild);
		}
	}

	processTemplate(template, item) {
		// Replace template variables like {{item_name}} with actual values
		let processedTemplate = template.replace(
			/\{\{\s*item_([^}]+)\s*\}\}/g,
			(match, property) => {
				// Trim any whitespace from the property name
				const cleanProperty = property.trim();
				const value = item[cleanProperty] || '';
				return value;
			}
		);

		// Handle {{item}} for primitive values (if item is not an object)
		processedTemplate = processedTemplate.replace(/\{\{\s*item\s*\}\}/g, () =>
			item !== undefined && item !== null ? String(item) : ''
		);

		return processedTemplate;
	}
}
