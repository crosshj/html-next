import { BaseUIComponent } from './BaseUIComponent.js';
import { html } from '../framework.utils.js';
import { getState, subscribeToState } from '../framework.core.js';

// Define x-navbar web component
export class XNavbar extends BaseUIComponent {
	constructor() {
		super();
		this.unsubscribe = null;

		// Store the original content for the right side actions
		this.originalContent = this.innerHTML + '';
	}

	connectedCallback() {
		// Call parent connectedCallback first to handle sx: styles
		super.connectedCallback();

		// Determine which global state key provides the title source
		const titleSource = this.getAttribute('titleSource') || 'activePath';

		// Subscribe to title source changes to update the title
		this.unsubscribe = subscribeToState(titleSource, () => {
			this.updateTitle();
		});

		// Set initial title
		this.updateTitle();
	}

	disconnectedCallback() {
		if (this.unsubscribe) {
			this.unsubscribe();
		}
	}

	updateTitle() {
		const titleSource = this.getAttribute('titleSource') || 'activePath';
		const manualTitle = this.getAttribute('titleText');
		const activePath = getState(titleSource) || '';
		let title = manualTitle || 'Navigation';

		// Derive title from state when manual title not provided
		if (!manualTitle && activePath.startsWith('/')) {
			// Extract title from path for other pages
			const pathName = activePath.substring(1); // Remove leading slash
			// Add spaces around forward slashes and remove x- prefix for better readability
			let formattedPath = pathName.replace(
				/\//g,
				html`<span class="breadcrumb-separator"> > </span>`
			);
			// Remove x- prefix from component names
			formattedPath = formattedPath.replace(/x-/g, '');
			title =
				formattedPath.trim().charAt(0).toUpperCase() + formattedPath.slice(1);
		}

		// Check if hamburger menu button should be shown
		const menuButtonShow = this.getAttribute('menuButtonShow');
		const menuButtonTarget = this.getAttribute('menuButtonTarget') || 'sidebar';
		const showMenuButton = menuButtonShow === 'true';

		// Create hamburger button if needed
		const hamburgerButton = showMenuButton
			? html`
					<button
						class="navbar-hamburger"
						onclick="document.getElementById('${menuButtonTarget}')?.classList?.toggle('open')"
						aria-label="Toggle menu"
					>
						<span class="hamburger-line"></span>
						<span class="hamburger-line"></span>
						<span class="hamburger-line"></span>
					</button>
			  `
			: '';

		// Create navbar structure with either breadcrumb navigation or custom title
		const titleElement = manualTitle
			? html`<div class="navbar-title">${title}</div>`
			: html`<x-breadcrumb pathSource="${titleSource}"></x-breadcrumb>`;

		this.innerHTML = html`
			<div class="navbar-header">
				<div class="navbar-left">${hamburgerButton} ${titleElement}</div>
				<div class="navbar-right">
					${this.originalContent
						? `<div class="navbar-actions">${this.originalContent}</div>`
						: ''}
				</div>
			</div>
		`;
	}
}
