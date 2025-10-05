import { BaseUIComponent } from './BaseUIComponent.js';

// Define x-typography web component
export class XTypography extends BaseUIComponent {
	constructor() {
		super();
	}

	connectedCallback() {
		// Call parent connectedCallback first to handle sx: styles
		super.connectedCallback();

		// Handle content - use sx:contents if present, otherwise use child content
		const sxContents = this.getAttribute('sx:contents');
		if (sxContents) {
			// Use sx:contents as the text content
			this.textContent = sxContents;
		}
		// If sx:contents is not present, leave the existing child content as-is

		// Set display - use attribute value if present, otherwise default based on variant
		const displayAttr = this.getAttribute('display');
		if (displayAttr) {
			this.style.display = displayAttr;
		} else {
			// Default behavior based on variant
			const variant = this.getAttribute('variant');
			if (variant === 'strong') {
				this.style.display = 'inline';
			} else {
				this.style.display = 'block';
			}
		}
	}
}
