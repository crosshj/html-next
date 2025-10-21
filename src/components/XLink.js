import { Navigate, frameworkCore } from '../framework.core.js';

// Define x-link web component
export class XLink extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		const href = this.getAttribute('href');
		const underline = this.getAttribute('underline');

		// Create a link element
		const link = document.createElement('a');
		// For hash navigation, use current page + hash fragment
		if (href) {
			const hash = href.startsWith('#') ? href : `#${href}`;
			link.href = window.location.pathname + window.location.search + hash;
		} else {
			link.href = '#';
		}
		link.innerHTML = this.innerHTML;

		if (underline === 'none') {
			link.style.textDecoration = 'none';
		}

		link.addEventListener('click', async (e) => {
			e.preventDefault();
			Navigate(href, { triggeredBy: 'link', element: this });
		});

		this.innerHTML = '';
		this.appendChild(link);
	}
}
