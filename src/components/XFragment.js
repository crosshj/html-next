import { BaseUIComponent } from './BaseUIComponent.js';
import { html } from '../framework.utils.js';
import { cleanServerHTML } from '../framework.utils.js';
import { getState, subscribeToState } from '../framework.core.js';

// Define x-fragment web component
export class XFragment extends BaseUIComponent {
	constructor() {
		super();
		this.unsubscribe = null;
	}

	connectedCallback() {
		// Call parent connectedCallback first to handle sx: styles
		super.connectedCallback();

		const contents = this.getAttribute('contents');
		const showLoading = this.getAttribute('showLoading') !== 'false';

		if (!contents) {
			console.warn('x-fragment: no contents attribute provided');
			return;
		}

		// Remove global_ prefix if present
		const actualPath = contents.startsWith('global_')
			? contents.substring(7)
			: contents;

		// Subscribe to changes in the content
		this.unsubscribe = subscribeToState(actualPath, (eventDetail) => {
			this.updateContent(eventDetail.newValue, showLoading);
		});

		// Set initial content
		const initialContent = getState(actualPath);
		this.updateContent(initialContent, showLoading);
	}

	updateContent(content, showLoading) {
		// Get the fragment's classes to pass to descendants
		const fragmentClasses = this.className;

		if (content === null || content === undefined) {
			if (showLoading) {
				this.innerHTML = html`
					<div
						class="fragment-loading-spinner ${fragmentClasses}"
						style="display: flex; align-items: center; justify-content: center; height: 100%;"
					>
						<div
							style="width: 40px; height: 40px; border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"
						></div>
					</div>
				`;
			} else {
				this.innerHTML = `<div class="fragment-no-loading-spinner ${fragmentClasses}"></div>`;
			}
			return;
		}

		// If content is a string, treat it as HTML
		if (typeof content === 'string') {
			try {
				// Use centralized cleaning function
				const cleanedContent = cleanServerHTML(content);
				// Wrap the content in a div with the fragment's classes
				this.innerHTML = `<div class="${fragmentClasses}">${cleanedContent}</div>`;
			} catch (error) {
				console.error('Error processing fragment content:', error);
				this.innerHTML = `<div class="${fragmentClasses}" style="padding: 20px; color: red;">Error processing content</div>`;
			}
		} else {
			// If content is an object or other type, stringify it
			try {
				this.innerHTML = html`<pre class="${fragmentClasses}">
${JSON.stringify(content, null, 2)}</pre
				>`;
			} catch (error) {
				console.error('Error stringifying fragment content:', error);
				this.innerHTML = `<div class="${fragmentClasses}" style="padding: 20px; color: red;">Error displaying content</div>`;
			}
		}
	}

	disconnectedCallback() {
		if (this.unsubscribe) {
			this.unsubscribe();
		}
	}
}
