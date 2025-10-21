// Framework Core - Centralized system management
import { XModal } from './components/XModal.js';

// Helper function to find script flows in DOM
function findScriptFlow(flowKey) {
	const script = document.querySelector(
		`script[type="application/flow"][data-key="${flowKey}"]`
	);
	if (script) {
		return script.textContent.trim();
	}
	return null;
}

class FrameworkCore {
	constructor() {
		this.state = {};
		this.listeners = new Map(); // Map of property -> Set of listeners
		this.dataSources = new Map(); // Map of name -> data source config
		this.subscriptions = new Map(); // Map of path -> subscription config
		this.flows = new Map(); // Map of key -> flow definition
		this.componentHooks = new Map(); // Map of component type -> Set of hook functions
		this.urlCache = new Map(); // Map of url -> {data, promise, loading}
		this.initialized = false;
	}

	// Initialize the state manager
	initialize(routerContext = null) {
		if (this.initialized) return;

		this.initialized = true;

		// Store router context if provided
		if (routerContext) {
			this.routerContext = routerContext;
		}
		console.log('StateManager initialized');
	}

	// Set a state value and notify listeners
	set(property, value) {
		const oldValue = this.state[property];

		// Only update if value actually changed
		if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
			this.state[property] = value;

			// Reset window.state with current state BEFORE notifying listeners
			if (typeof window !== 'undefined') {
				window.state = { ...this.state };
			}

			// Notify listeners for this property
			this.notifyListeners(property, {
				property,
				oldValue,
				newValue: value,
				state: { ...this.state },
			});
		}
	}

	// Get a state value
	get(property) {
		return this.state[property];
	}

	// Get data with URL fetching support
	async GetData(name) {
		const dataSource = this.dataSources.get(name);
		if (!dataSource) {
			return this.get(name);
		}

		// If it's a URL-based data source, handle fetching
		if (dataSource.url) {
			return await this.fetchUrlData(name, dataSource);
		}

		// Otherwise return the current state value
		return this.get(name);
	}

	// Fetch URL data with caching and lazy loading
	async fetchUrlData(name, dataSource) {
		const { url, lazy, defaultValue } = dataSource;

		// Check if we already have this data cached
		if (this.urlCache.has(url)) {
			const cached = this.urlCache.get(url);
			if (cached.data !== undefined) {
				return cached.data;
			}
			// If it's currently loading, wait for the existing promise
			if (cached.promise) {
				return await cached.promise;
			}
		}

		// If lazy loading is enabled and we haven't fetched yet, return default value
		if (lazy && !this.urlCache.has(url)) {
			this.urlCache.set(url, {
				data: undefined,
				promise: null,
				loading: false,
			});
			return defaultValue;
		}

		// Create fetch promise
		const fetchPromise = this.performUrlFetch(url, name);

		// Cache the promise
		this.urlCache.set(url, {
			data: undefined,
			promise: fetchPromise,
			loading: true,
		});

		try {
			const data = await fetchPromise;

			// Update cache with raw data (template processing happens in GetData)
			this.urlCache.set(url, {
				data,
				promise: null,
				loading: false,
			});

			// Update state with the raw data
			this.set(name, data);

			return data;
		} catch (error) {
			console.error(`Error fetching data from ${url}:`, error);

			// Update cache to indicate error
			this.urlCache.set(url, {
				data: defaultValue,
				promise: null,
				loading: false,
			});

			// Set default value in state
			this.set(name, defaultValue);
			return defaultValue;
		}
	}

	// Perform the actual URL fetch
	async performUrlFetch(url, name) {
		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const text = await response.text();

			// Try to parse as JSON if it looks like JSON
			if (url.endsWith('.json') || this.looksLikeJson(text)) {
				try {
					return JSON.parse(text);
				} catch (parseError) {
					console.warn(
						`Failed to parse JSON from ${url}, using as text:`,
						parseError
					);
					return text;
				}
			}

			// Return as text for HTML and other content
			return text;
		} catch (error) {
			throw new Error(`Failed to fetch ${url}: ${error.message}`);
		}
	}

	// Check if text looks like JSON
	looksLikeJson(text) {
		const trimmed = text.trim();
		return (
			(trimmed.startsWith('{') && trimmed.endsWith('}')) ||
			(trimmed.startsWith('[') && trimmed.endsWith(']'))
		);
	}

	// Get the entire state object (read-only copy)
	getState() {
		return { ...this.state };
	}

	// Subscribe to changes on a specific property
	subscribe(property, callback) {
		if (!this.listeners.has(property)) {
			this.listeners.set(property, new Set());
		}
		this.listeners.get(property).add(callback);

		// Return unsubscribe function
		return () => {
			const propertyListeners = this.listeners.get(property);
			if (propertyListeners) {
				propertyListeners.delete(callback);
			}
		};
	}

	// Notify all listeners for a property
	notifyListeners(property, eventDetail) {
		const propertyListeners = this.listeners.get(property);
		if (propertyListeners) {
			propertyListeners.forEach((callback) => {
				try {
					callback(eventDetail);
				} catch (error) {
					console.error(`Error in state listener for ${property}:`, error);
				}
			});
		}
	}

	// Initialize a property with a default value (only if not already set)
	initializeProperty(property, defaultValue) {
		if (this.state[property] === undefined) {
			this.set(property, defaultValue);
		}
	}

	// Check if a property exists
	has(property) {
		return property in this.state;
	}

	// Get all property names
	getProperties() {
		return Object.keys(this.state);
	}

	// Register a data source
	registerDataSource(attributes, body) {
		const { name, defaultValue, defaultvalue, route, url, lazy } = attributes;

		if (!name) return;

		// Handle both camelCase and lowercase attribute names
		const value = defaultValue !== undefined ? defaultValue : defaultvalue;
		const isLazy = lazy === 'true' || lazy === true;

		// Store data source configuration
		this.dataSources.set(name, {
			defaultValue: value,
			route,
			url,
			lazy: isLazy,
		});

		// Handle route-based data sources
		if (name === 'pathData' && route) {
			this.setupPathDataListener(route);
			return;
		}

		// Handle URL-based data sources
		if (url) {
			// Initialize with default value
			if (value !== undefined) {
				let parsedValue = value;
				try {
					parsedValue = JSON.parse(value);
				} catch (e) {
					// Keep as string if not JSON
				}
				this.initializeProperty(name, parsedValue);
			}

			// If not lazy, fetch immediately
			if (!isLazy) {
				this.fetchUrlData(name, { url, lazy: isLazy, defaultValue: value });
			}
			return;
		}

		// Handle simple data sources
		if (value !== undefined) {
			let parsedValue = value;
			try {
				parsedValue = JSON.parse(value);
			} catch (e) {
				// Keep as string if not JSON
			}
			this.initializeProperty(name, parsedValue);
		}
	}

	// Unregister a data source
	unregisterDataSource(name) {
		this.dataSources.delete(name);
		// Note: We don't clear the state value, just the registration
	}

	// Register a subscription
	registerSubscription(attributes, body) {
		const { path, handler } = attributes;

		if (!path || !handler) return;

		// Store subscription configuration
		this.subscriptions.set(path, { handler });

		// Set up listener
		const unsubscribe = this.subscribe(path, async (eventDetail) => {
			await this.triggerFlow(handler, eventDetail);
		});

		// Trigger the flow immediately with current value if it exists
		const currentValue = this.get(path);
		if (currentValue !== undefined) {
			// Use setTimeout to ensure this happens after the subscription is fully set up
			setTimeout(async () => {
				await this.triggerFlow(handler, {
					property: path,
					oldValue: undefined,
					newValue: currentValue,
					state: { ...this.state },
				});
			}, 0);
		}

		return unsubscribe;
	}

	// Unregister a subscription
	unregisterSubscription(path) {
		this.subscriptions.delete(path);
	}

	// Register a flow
	registerFlow(attributes, body) {
		const { key } = attributes;

		if (!key || !body) return;

		// Store flow definition
		this.flows.set(key, body);
	}

	// Unregister a flow
	unregisterFlow(key) {
		this.flows.delete(key);
	}

	// Trigger a flow by key
	async triggerFlow(flowKey, eventDetail, currentFlowKey = null) {
		let code = this.flows.get(flowKey);

		// If flow not found in registered flows, check for script flows in DOM
		if (!code) {
			code = findScriptFlow(flowKey);
		}

		if (code) {
			await this.executeFlow(code, eventDetail, currentFlowKey);
		} else {
			console.warn(`Flow not found: ${flowKey}`);
		}
	}

	// Execute flow code
	async executeFlow(code, eventDetail, currentFlowKey = null) {
		// Store event detail for flow access
		window.lastFlowEvent = eventDetail;

		// Check if code is empty or just whitespace
		if (!code || !code.trim()) {
			console.warn('Flow execution skipped: empty code');
			return;
		}

		// Additional validation for potentially dangerous content
		if (typeof code !== 'string') {
			console.warn('Flow execution skipped: code is not a string');
			return;
		}

		// Check for obviously malformed code that could crash the browser
		if (
			code.includes('undefined') &&
			code.includes('null') &&
			code.length < 10
		) {
			console.warn('Flow execution skipped: potentially malformed code');
			return;
		}

		try {
			// Create execution context
			const self = this; // Store reference to FrameworkCore instance
			const currentState = self.getState();

			// Create deep copies to prevent direct mutation
			const stateCopy = JSON.parse(JSON.stringify(currentState));

			const flowContext = {
				global: stateCopy,
				state: stateCopy,
				get event() {
					return window.lastFlowEvent || {};
				},

				SetState: (name, value) => self.set(name, value),
				setState: (name, value) => self.set(name, value),
				SetData: (name, value) => self.SetData(name, value),
				setData: (name, value) => self.SetData(name, value),
				GetData: (name) => self.GetData(name),
				getData: (name) => self.GetData(name),
				Query: (options) => self.Query(options),
				query: (options) => self.Query(options),
				Navigate: (path) => self.Navigate(path),
				navigate: (path) => self.Navigate(path),
				Alert: (message, title) => self.Alert(message, title),
				alert: (message, title) => self.Alert(message, title),
				Confirm: (message, title) => self.Confirm(message, title),
				confirm: (message, title) => self.Confirm(message, title),
				Trigger: (flowKey, data) => {
					const newStack = [
						...(eventDetail.flowStack || []),
						currentFlowKey,
					].filter(Boolean);
					return self.triggerFlow(
						flowKey,
						{
							triggeredBy: 'flow',
							flowStack: newStack,
							data: data || {},
						},
						flowKey
					);
				},
				// Router hooks - properly injected from router context
				get routerBeforeEach() {
					return self.routerContext?.beforeEach;
				},
				get routerAfterEach() {
					return self.routerContext?.afterEach;
				},
				get router() {
					return self.routerContext;
				},
			};

			// Validate that we can create a function from this code
			let flowFunction;
			try {
				flowFunction = new Function(
					...Object.keys(flowContext),
					`"use strict"; return (async () => { ${code} })();`
				);
			} catch (syntaxError) {
				console.error('Flow syntax error:', syntaxError);
				console.error('Problematic code:', code);
				return;
			}

			// Execute the flow - no timeout for user interactions
			// The timeout was too aggressive for flows that involve user interaction (modals, etc.)
			await flowFunction.apply(flowContext, Object.values(flowContext));
		} catch (error) {
			console.error('Flow execution error:', error);
			console.error('Problematic code:', code);
		}
	}

	// Setup path data listener (moved from x-data)
	setupPathDataListener(route) {
		let urlPattern;
		try {
			const [basePath, hashPattern] = route.split('#/');
			if (!hashPattern) return;

			const baseUrl = `${window.location.protocol}//${window.location.host}${basePath}`;
			urlPattern = new URLPattern({
				baseURL: baseUrl,
				hash: `#/${hashPattern}`,
			});
		} catch (e) {
			return;
		}

		const extractPathData = () => {
			const currentUrl = window.location.href;
			const match = urlPattern.exec(currentUrl);

			let newValue;
			if (match && match.hash && match.hash.groups) {
				newValue = match.hash.groups;
			} else {
				// If no hash is present, redirect to #/
				if (!window.location.hash) {
					window.location.hash = '#/';
					return; // Let the hashchange event handle the redirect
				}
				newValue = {};
			}

			this.set('pathData', newValue);
		};

		// Set initial value
		extractPathData();

		// Listen for hash changes
		window.addEventListener('hashchange', extractPathData);
		window.addEventListener('navigate', () => {
			setTimeout(extractPathData, 0);
		});
	}

	// Universal registration method
	register({ type, attributes, body }) {
		switch (type) {
			case 'x-data':
				return this.registerDataSource(attributes, body);
			case 'x-subscribe':
				return this.registerSubscription(attributes, body);
			case 'x-flow':
				return this.registerFlow(attributes, body);
			default:
				console.warn(`Unknown component type: ${type}`);
				return () => {}; // Return no-op unregister function
		}
	}

	// Utility function to load page content
	async Query(options) {
		const { url } = options;

		if (!url) {
			return '';
		}

		// Add leading slash if not present
		const fullPath = url.startsWith('/') ? url : `/${url}`;

		try {
			const response = await fetch(fullPath);
			const content = await response.text();
			return content;
		} catch (error) {
			console.error('Error loading page content:', error);
			return `<div style="padding: 20px; color: red;">Error loading content: ${error.message}</div>`;
		}
	}

	// Utility function to navigate to a new path
	Navigate(path, options = {}) {
		if (this.routerContext) {
			this.triggerFlow('routerNavigate', {
				triggeredBy: options.triggeredBy || 'Navigate',
				href: path,
				element: options.element,
			});
		} else {
			window.location.hash = path;
		}
	}

	// Utility function to show alert dialog
	async Alert(options = {}) {
		const { message = '', title = 'Alert', dispose = true } = options;

		// Check for existing modal first
		const existingModal = XModal.findExistingModal();
		if (existingModal) {
			const result = await new Promise((resolve) => {
				existingModal.updateAndShow(message, title, 'alert', resolve);
			});
			// Handle dispose after promise resolves
			if (dispose) {
				existingModal.dispose();
			} else {
				existingModal.hideContent();
			}
			return result;
		}

		// Create new modal
		const result = await XModal.alert(message, title);
		// Handle dispose after promise resolves
		const modal = XModal.findExistingModal();
		if (modal) {
			if (dispose) {
				modal.dispose();
			} else {
				modal.hideContent();
			}
		}
		return result;
	}

	// Utility function to show confirm dialog
	async Confirm(options = {}) {
		const { message = '', title = 'Confirm', dispose = true } = options;

		// Check for existing modal first
		const existingModal = XModal.findExistingModal();
		if (existingModal) {
			const result = await new Promise((resolve) => {
				existingModal.updateAndShow(message, title, 'confirm', resolve);
			});
			// Handle dispose after promise resolves
			if (dispose) {
				existingModal.dispose();
			} else {
				existingModal.hideContent();
			}
			return result;
		}

		// Create new modal
		const result = await XModal.confirm(message, title);
		// Handle dispose after promise resolves
		const modal = XModal.findExistingModal();
		if (modal) {
			if (dispose) {
				modal.dispose();
			} else {
				modal.hideContent();
			}
		}
		return result;
	}

	// Utility function to set data (with Promise support and dot notation)
	async SetData(name, value) {
		// If value is a Promise, await it
		const resolvedValue = value instanceof Promise ? await value : value;

		// Handle dot notation for nested objects
		if (name.includes('.')) {
			this.setNested(name, resolvedValue);
		} else {
			this.set(name, resolvedValue);
		}
	}

	// Helper function to set nested object values using dot notation
	setNested(path, value) {
		const keys = path.split('.');
		const rootKey = keys[0];

		// Get or create the root object (copy to ensure change detection works)
		let rootObject = this.state[rootKey]
			? JSON.parse(JSON.stringify(this.state[rootKey]))
			: {};
		let current = rootObject;

		// Navigate to the parent of the target key
		for (let i = 1; i < keys.length - 1; i++) {
			if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
				current[keys[i]] = {};
			}
			current = current[keys[i]];
		}

		// Set the final value
		const finalKey = keys[keys.length - 1];
		current[finalKey] = value;

		// Update the root object in state (this triggers change detection)
		this.set(rootKey, rootObject);
	}

	// Register a component hook
	registerComponentHook(componentType, hookFunction) {
		if (!this.componentHooks.has(componentType)) {
			this.componentHooks.set(componentType, new Set());
		}
		this.componentHooks.get(componentType).add(hookFunction);

		// Return unsubscribe function
		return () => {
			const hooks = this.componentHooks.get(componentType);
			if (hooks) {
				hooks.delete(hookFunction);
			}
		};
	}

	// Unregister a component hook
	unregisterComponentHook(componentType, hookFunction) {
		const hooks = this.componentHooks.get(componentType);
		if (hooks) {
			hooks.delete(hookFunction);
		}
	}

	// Execute all hooks for a component type
	executeComponentHooks(componentType, componentInstance, ...args) {
		const hooks = this.componentHooks.get(componentType);
		if (hooks) {
			hooks.forEach((hookFunction) => {
				try {
					hookFunction(componentInstance, ...args);
				} catch (error) {
					console.error(`Error in ${componentType} hook:`, error);
				}
			});
		}
	}

	// Clear all state (useful for testing)
	clear() {
		this.state = {};
		this.listeners.clear();
		this.dataSources.clear();
		this.subscriptions.clear();
		this.flows.clear();
		this.componentHooks.clear();
	}

	// Debug method to get all active subscriptions
	getActiveSubscriptions() {
		const subscriptions = {};
		for (const [property, listeners] of this.listeners.entries()) {
			subscriptions[property] = {
				count: listeners.size,
				listeners: Array.from(listeners).map((listener) => ({
					name: listener.name || 'anonymous',
					toString: listener.toString(),
				})),
			};
		}
		return subscriptions;
	}

	// Debug method to log all active subscriptions
	logActiveSubscriptions() {
		const subscriptions = this.getActiveSubscriptions();
		console.log('🔍 Active State Subscriptions:', subscriptions);
		return subscriptions;
	}
}

// Create singleton instance
export const frameworkCore = new FrameworkCore();

// Export functions that components can use
export function initializeCore(routerContext = null) {
	frameworkCore.initialize(routerContext);
}

export function setState(property, value) {
	frameworkCore.set(property, value);
}

// Export SetState as an alias for setState (for flows compatibility)
export const SetState = setState;

// Export SetData function
export function SetData(name, value) {
	return frameworkCore.SetData(name, value);
}

// Export GetData function
export function GetData(name) {
	return frameworkCore.GetData(name);
}

export function getState(property) {
	return frameworkCore.get(property);
}

export function getFullState() {
	return frameworkCore.getState();
}

export function subscribeToState(property, callback) {
	return frameworkCore.subscribe(property, callback);
}

// Registration functions
export function registerDataSource(attributes, body) {
	return frameworkCore.registerDataSource(attributes, body);
}

export function unregisterDataSource(name) {
	return frameworkCore.unregisterDataSource(name);
}

export function registerSubscription(attributes, body) {
	return frameworkCore.registerSubscription(attributes, body);
}

export function unregisterSubscription(path) {
	return frameworkCore.unregisterSubscription(path);
}

export function registerFlow(attributes, body) {
	return frameworkCore.registerFlow(attributes, body);
}

export function unregisterFlow(key) {
	return frameworkCore.unregisterFlow(key);
}

export function register({ type, attributes, body }) {
	return frameworkCore.register({ type, attributes, body });
}

// Component hook functions
export function registerComponentHook(componentType, hookFunction) {
	return frameworkCore.registerComponentHook(componentType, hookFunction);
}

export function unregisterComponentHook(componentType, hookFunction) {
	return frameworkCore.unregisterComponentHook(componentType, hookFunction);
}

export function executeComponentHooks(
	componentType,
	componentInstance,
	...args
) {
	return frameworkCore.executeComponentHooks(
		componentType,
		componentInstance,
		...args
	);
}

// Export the core instance for advanced usage (already exported above)

// Export utility functions
export function Navigate(path) {
	if (path) {
		frameworkCore.Navigate(path);
	}
}

export async function Query(options) {
	return await frameworkCore.Query(options);
}

export async function Alert(options = {}) {
	return await frameworkCore.Alert(options);
}

export async function Confirm(options = {}) {
	return await frameworkCore.Confirm(options);
}

export async function Trigger(flowKey, data = {}, options = {}) {
	return await frameworkCore.triggerFlow(flowKey, {
		triggeredBy: options.triggeredBy || 'manual',
		data: data,
		flowStack: options.flowStack || [],
		element: options.element,
	});
}

// Initialize window.state for debugging
if (typeof window !== 'undefined') {
	window.state = { ...frameworkCore.getState() };
	window.subscribeToState = (property, callback) =>
		frameworkCore.subscribe(property, callback);

	// Debug methods
	window.getActiveSubscriptions = () => frameworkCore.getActiveSubscriptions();
	window.logActiveSubscriptions = () => frameworkCore.logActiveSubscriptions();
}
