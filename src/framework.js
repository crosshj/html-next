// Framework.js - Module for loading web components and fragments
import { html } from './framework.utils.js';
import { BaseUIComponent } from './components/BaseUIComponent.js';
import {
	initializeCore,
	setState,
	getState,
	subscribeToState,
	frameworkCore,
	registerComponentHook,
} from './framework.core.js';

// Import all framework components
import { SystemElement } from './components/SystemElement.js';
import { XData } from './components/XData.js';
import { XSubscribe } from './components/XSubscribe.js';
import { XFlow } from './components/XFlow.js';
import { XPage } from './components/XPage.js';
import { XNavbar } from './components/XNavbar.js';
import { XContent } from './components/XContent.js';
import { XBox } from './components/XBox.js';
import { XBreadcrumb } from './components/XBreadcrumb.js';
import { XButton } from './components/XButton.js';
import { XTypography } from './components/XTypography.js';
import { XLink } from './components/XLink.js';
import { XMap } from './components/XMap.js';
import { XIcon } from './components/XIcon.js';
import { XFragment } from './components/XFragment.js';
import { XInclude } from './components/XInclude.js';
import { XVizBar } from './components/XVizBar.js';
import { XVizPie } from './components/XVizPie.js';
import { XVizLine } from './components/XVizLine.js';
import { XMarkdown } from './components/XMarkdown.js';
import { XTable } from './components/XTable.js';
import { XForm } from './components/XForm.js';
import { XSchema } from './components/XSchema.js';
import { XModal } from './components/XModal.js';
import { XFill } from './components/XFill.js';
import {
	cleanServerHTML,
	transformContentElements,
} from './framework.utils.js';

// Register all web components
function registerFrameworkComponents() {
	const components = [
		{ name: 'x-flow', class: XFlow },
		{ name: 'x-page', class: XPage },
		{ name: 'x-navbar', class: XNavbar },
		{ name: 'x-content', class: XContent },
		{ name: 'x-box', class: XBox },
		{ name: 'x-breadcrumb', class: XBreadcrumb },
		{ name: 'x-button', class: XButton },
		{ name: 'x-typography', class: XTypography },
		{ name: 'x-include', class: XInclude },
		{ name: 'x-link', class: XLink },
		{ name: 'x-map', class: XMap },
		{ name: 'x-icon', class: XIcon },
		{ name: 'x-data', class: XData },
		{ name: 'x-subscribe', class: XSubscribe },
		{ name: 'x-fragment', class: XFragment },
		{ name: 'x-viz-bar', class: XVizBar },
		{ name: 'x-viz-pie', class: XVizPie },
		{ name: 'x-viz-line', class: XVizLine },
		{ name: 'x-markdown', class: XMarkdown },
		{ name: 'x-table', class: XTable },
		{ name: 'x-form', class: XForm },
		{ name: 'x-schema', class: XSchema },
		{ name: 'x-modal', class: XModal },
		{ name: 'x-fill', class: XFill },
	];

	for (const { name, class: ComponentClass } of components) {
		if (customElements.get(name)) continue;
		customElements.define(name, ComponentClass);
	}
}

// Function to load and replace body content
export async function loadFragment(fragmentPath) {
	try {
		// Initialize core if not already done
		initializeCore();

		// Set the current page path for relative path resolution
		setState('currentPath', fragmentPath);

		const response = await fetch(fragmentPath);
		if (!response.ok) {
			throw new Error(`Failed to load fragment: ${response.status}`);
		}
		const content = await response.text();
		console.log({ content });

		// Protect against empty content
		if (!content || typeof content !== 'string') {
			console.warn('Fragment content is empty or invalid');
			document.body.innerHTML = html`<div style="padding: 20px; color: orange;">
				Warning: Fragment content is empty or invalid
			</div>`;
			return;
		}

		const cleanedContent = cleanServerHTML(content);

		// Additional check after cleaning
		if (!cleanedContent || cleanedContent.trim() === '') {
			console.warn('Fragment content is empty after cleaning');
			document.body.innerHTML = html`<div style="padding: 20px; color: orange;">
				Warning: Fragment content is empty after processing
			</div>`;
			return;
		}

		document.body.innerHTML = cleanedContent;

		// Flows will execute themselves based on their own attributes and state
		// No manual execution needed - they handle their own lifecycle
	} catch (error) {
		console.error('Error loading fragment:', error);
		document.body.innerHTML = html`<div style="padding: 20px; color: red;">
			Error loading fragment: ${error.message}
		</div>`;
	}
}

// Initialize framework
export async function initializeFramework(options = {}) {
	// Handle both old signature (routerContext) and new signature (options object)
	const routerContext = options.router || options;
	const state = options.state || {};
	const hooks = options.hooks || {};

	// Initialize core first with router context
	initializeCore(routerContext);

	// Register router with framework if provided
	if (
		routerContext &&
		typeof routerContext.registerWithFramework === 'function'
	) {
		await routerContext.registerWithFramework(frameworkCore);
	}

	// Register component hooks
	Object.entries(hooks).forEach(([componentType, hookFunction]) => {
		registerComponentHook(componentType, hookFunction);
	});

	// Initialize state if provided
	if (Object.keys(state).length > 0) {
		Object.entries(state).forEach(([key, value]) => {
			frameworkCore.set(key, value);
		});
	}

	// Register all components first
	registerFrameworkComponents();

	// Trigger initial navigation if router is provided
	if (
		routerContext &&
		typeof routerContext.triggerInitialNavigation === 'function'
	) {
		await routerContext.triggerInitialNavigation();
	}

	// Framework initialized with all web components registered
}

// Re-export state management functions for convenience
export { setState, getState, subscribeToState };

// Components will be initialized explicitly when needed
