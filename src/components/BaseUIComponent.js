import {
	parseConditionalValue,
	extractStateReferences,
} from '../framework.utils.js';

export class BaseUIComponent extends HTMLElement {
	constructor() {
		super();
		this.stateSubscriptions = new Map(); // Map of stateKey -> unsubscribe function
		this.initialState = null;
		this.originalAttributes = new Map(); // Store ALL original attributes for re-evaluation

		// Set up state subscriptions immediately in constructor
		// This ensures we don't miss state changes that happen before connectedCallback
		this.setupStateSubscriptions();
	}

	connectedCallback() {
		// Store initial state for conditional rendering
		this.initialState = this.getCurrentState();

		// Store ALL original attributes for re-evaluation
		this.storeOriginalAttributes();

		// Apply initial styles and conditional attributes
		this.applySxStyles();
		this.applyConditionalAttributes();
	}

	disconnectedCallback() {
		// Clean up all state subscriptions
		this.stateSubscriptions.forEach((unsubscribe) => unsubscribe());
		this.stateSubscriptions.clear();
	}

	getCurrentState() {
		// Get current state from window.state or return empty object
		return typeof window !== 'undefined' && window.state
			? { ...window.state }
			: {};
	}

	storeOriginalAttributes() {
		// Store ALL original attributes for re-evaluation
		const attributes = Array.from(this.attributes);
		attributes.forEach((attr) => {
			this.originalAttributes.set(attr.name, attr.value);
		});
	}

	setupStateSubscriptions() {
		const stateRefs = extractStateReferences(this.attributes);

		stateRefs.forEach((stateKey) => {
			if (typeof window !== 'undefined' && window.subscribeToState) {
				const unsubscribe = window.subscribeToState(stateKey, (eventDetail) => {
					this.handleStateChange(eventDetail.state);
				});
				this.stateSubscriptions.set(stateKey, unsubscribe);
			}
		});
	}

	handleStateChange(newState) {
		// Update state and re-apply conditional rendering
		this.initialState = newState || this.getCurrentState();
		this.applySxStyles();
		this.applyConditionalAttributes();
	}

	applyConditionalAttributes() {
		// Handle ALL attributes with conditional syntax using original attributes
		this.originalAttributes.forEach((value, name) => {
			// Skip sx: attributes as they're handled by applySxStyles
			if (name.startsWith('sx:')) {
				return;
			}

			// Check if this attribute contains global_ references (conditional logic)
			if (
				value.includes('global_') ||
				value.includes('WHEN ') ||
				value.includes('DEBUG ')
			) {
				const isDebug = value.startsWith('DEBUG ');

				const resolvedValue = parseConditionalValue(value, this.initialState);

				// Apply the resolved value to the element
				if (name === 'className' || name === 'class') {
					this.className = resolvedValue;
				}
				this.setAttribute(name, resolvedValue);
			}
		});
	}

	/**
	 * Parse sx: attributes and apply them as CSS styles
	 * This method can be called by any component that needs sx: support
	 */
	applySxStyles() {
		// Use stored original attributes for evaluation
		const sxStyles = {};
		this.originalAttributes.forEach((value, name) => {
			if (name.startsWith('sx:')) {
				// Remove 'sx:' prefix and convert to CSS property
				const cssProperty = name.substring(3);
				const cssValue = parseConditionalValue(value, this.initialState);

				// Handle shorthand properties for padding and margin
				const shorthandProperties = this.expandShorthandProperty(
					cssProperty,
					cssValue
				);
				Object.assign(sxStyles, shorthandProperties);
			}
		});

		// Apply the styles directly to the element
		Object.entries(sxStyles).forEach(([property, value]) => {
			// Convert string values to numbers for numeric CSS properties
			const numericProperties = [
				'opacity',
				'zIndex',
				'fontWeight',
				'lineHeight',
			];
			if (
				numericProperties.includes(property) &&
				typeof value === 'string' &&
				!isNaN(value)
			) {
				this.style[property] = parseFloat(value);
			} else {
				this.style.setProperty(property, value);
			}
		});

		// Remove sx: attributes from DOM after first processing (keep DOM clean)
		const attributes = Array.from(this.attributes);
		attributes.forEach((attr) => {
			if (attr.name.startsWith('sx:')) {
				this.removeAttribute(attr.name);
			}
		});
	}

	/**
	 * Expand shorthand properties like sx:p, sx:pt, sx:py, etc.
	 * @param {string} property - The property name (e.g., 'p', 'pt', 'py')
	 * @param {string} value - The CSS value
	 * @returns {Object} - Object with expanded CSS properties
	 */
	expandShorthandProperty(property, value) {
		const expanded = {};

		// Add MUI-style spacing scale if value is unitless (just a number)
		// MUI uses 8px as the base spacing unit, so 1 = 8px, 2 = 16px, etc.
		const addMuiSpacing = (val) => {
			if (/^\d+(\.\d+)?$/.test(val)) {
				const spacingValue = parseFloat(val) * 8;
				return spacingValue + 'px';
			}
			return val;
		};

		// Step 1: Map shorthand/alias to kebab-case CSS property names
		const shorthandMap = {
			// Spacing shorthands
			m: 'margin',
			mt: 'margin-top',
			mr: 'margin-right',
			mb: 'margin-bottom',
			ml: 'margin-left',
			mx: 'margin-inline',
			my: 'margin-block',
			p: 'padding',
			pt: 'padding-top',
			pr: 'padding-right',
			pb: 'padding-bottom',
			pl: 'padding-left',
			px: 'padding-inline',
			py: 'padding-block',
			// Color shorthands
			bgcolor: 'background-color',
			bg: 'background-color',
		};

		// Convert shorthand to CSS property name (or use as-is)
		const cssProperty = shorthandMap[property] || property;

		// Apply spacing transformation for spacing-related properties
		const spacingProperties = [
			'margin',
			'padding',
			'top',
			'right',
			'bottom',
			'left',
			'width',
			'height',
			'min-width',
			'min-height',
			'max-width',
			'max-height',
		];
		const isSpacingProperty = spacingProperties.some((prop) =>
			cssProperty.includes(prop)
		);

		expanded[cssProperty] = isSpacingProperty ? addMuiSpacing(value) : value;

		return expanded;
	}
}
