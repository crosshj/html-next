import { BaseUIComponent } from './BaseUIComponent.js';

// Define x-content web component
export class XContent extends BaseUIComponent {
	constructor() {
		super();
	}

	connectedCallback() {
		// Call parent connectedCallback first to handle sx: styles
		super.connectedCallback();
	}
}
