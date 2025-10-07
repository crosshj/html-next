import { register } from '../framework.core.js';

// Base class for all system elements
export class SystemElement extends HTMLElement {
	constructor() {
		super();

		// Get content from content attribute or fallback to textContent
		let body = this.getAttribute('content');
		if (body) {
			// If content came from attribute, decode the escaped characters
			body = body
				.replace(/&quot;/g, '"')
				.replace(/&#39;/g, "'")
				.replace(/&#10;/g, '\n')
				.replace(/&#13;/g, '\r')
				.replace(/&#9;/g, '\t');
		} else {
			body = this.textContent ? this.textContent.trim() : '';
		}

		// Protect against empty or malformed content
		if (!body || typeof body !== 'string') {
			body = '';
		}

		// Additional validation for potentially dangerous content
		if (
			body.includes('undefined') &&
			body.includes('null') &&
			body.length < 10
		) {
			console.warn(
				'SystemElement: potentially malformed content detected, using empty string'
			);
			body = '';
		}

		this.unregister = register({
			type: this.tagName.toLowerCase(),
			attributes: this.getAllAttributes(),
			body: body,
		});
	}

	getAllAttributes() {
		const attributes = {};
		for (let i = 0; i < this.attributes.length; i++) {
			const attr = this.attributes[i];
			attributes[attr.name] = attr.value;
		}
		return attributes;
	}

	disconnectedCallback() {
		if (!this.unregister) return;
		this.unregister();
	}
}
