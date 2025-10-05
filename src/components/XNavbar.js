import { BaseUIComponent } from './BaseUIComponent.js';
import { html } from '../framework.utils.js';
import { getState, subscribeToState } from '../framework.core.js';

// Define x-navbar web component
export class XNavbar extends BaseUIComponent {
	constructor() {
		super();
		this.unsubscribe = null;
	}

	connectedCallback() {
		// Call parent connectedCallback first to handle sx: styles
		super.connectedCallback();

		// Subscribe to activePath changes to update the title
		this.unsubscribe = subscribeToState('activePath', () => {
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
		const activePath = getState('activePath') || '';
		let title = 'Navigation';

		// Map activePath to display title
		if (activePath.startsWith('/')) {
			// Extract title from path for other pages
			const pathName = activePath.substring(1); // Remove leading slash
			// Add spaces around forward slashes and remove x- prefix for better readability
			let formattedPath = pathName.replace(/\//g, ' / ');
			// Remove x- prefix from component names
			formattedPath = formattedPath.replace(/x-/g, '');
			title = formattedPath.charAt(0).toUpperCase() + formattedPath.slice(1);
		}

		// Store the original content for the right side actions
		const originalContent = this.innerHTML;

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

		// Create navbar structure with dark grey header
		this.innerHTML = html`
			<div class="navbar-header">
				<div class="navbar-left">
					${hamburgerButton}
					<x-typography variant="h1"> ${title} </x-typography>
				</div>
				<div class="navbar-right">
					<div class="navbar-actions">${originalContent}</div>
				</div>
			</div>
		`;
	}
}
