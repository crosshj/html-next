import { BaseUIComponent } from './BaseUIComponent.js';
import { html } from '../framework.utils.js';
import { getState, subscribeToState } from '../framework.core.js';

export class XBreadcrumb extends BaseUIComponent {
	constructor() {
		super();
		this.unsubscribe = null;
	}

	connectedCallback() {
		super.connectedCallback();

		const pathSource = this.getAttribute('pathSource') || 'activePath';
		this.unsubscribe = subscribeToState(pathSource, () => {
			this.render();
		});

		this.render();
	}

	disconnectedCallback() {
		if (this.unsubscribe) {
			this.unsubscribe();
		}
	}

	render() {
		const pathSource = this.getAttribute('pathSource') || 'activePath';
		const activePath = getState(pathSource) || '';

		if (!activePath || !activePath.startsWith('/')) {
			this.innerHTML = '';
			return;
		}

		// Parse the path into segments
		const segments = activePath
			.split('/')
			.filter((segment) => segment.length > 0);
		const breadcrumbs = [];

		// Build breadcrumb segments (no Home)
		let currentPath = '';
		segments.forEach((segment, index) => {
			currentPath += '/' + segment;
			const isLast = index === segments.length - 1;

			// Clean up segment name for display
			let label = segment.replace(/x-/g, ''); // Remove x- prefix
			label = label.charAt(0).toUpperCase() + label.slice(1); // Capitalize first letter

			breadcrumbs.push({
				label: label,
				path: currentPath,
				isActive: isLast,
			});
		});

		// Generate breadcrumb HTML with separate separators
		const breadcrumbItems = [];
		breadcrumbs.forEach((crumb, index) => {
			if (crumb.isActive) {
				breadcrumbItems.push(html`
					<span class="breadcrumb-item breadcrumb-current">${crumb.label}</span>
				`);
			} else {
				breadcrumbItems.push(html`
					<a
						href="${crumb.path}"
						class="breadcrumb-item breadcrumb-link"
						onclick="event.preventDefault(); window.location.hash = '${crumb.path}'; return false;"
						>${crumb.label}</a
					>
				`);
			}

			// Add separator after each item except the last
			if (index < breadcrumbs.length - 1) {
				breadcrumbItems.push(html`
					<span class="breadcrumb-separator">></span>
				`);
			}
		});

		this.innerHTML = html`
			<nav
				class="breadcrumb-container"
				role="navigation"
				aria-label="Breadcrumb"
			>
				${breadcrumbItems.join('')}
			</nav>
		`;
	}
}
