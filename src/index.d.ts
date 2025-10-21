// HTMLNext TypeScript Definitions

export interface FrameworkState {
	[key: string]: any;
}

export interface StateEventDetail {
	property: string;
	oldValue: any;
	newValue: any;
	state: FrameworkState;
}

// Main framework function
export function initializeFramework(options?: {
	router?: any;
	state?: FrameworkState;
	hooks?: Record<string, (component: HTMLElement) => void>;
}): Promise<void>;

// State management functions
export function setState(property: string, value: any): void;
export function SetState(property: string, value: any): void;
export function SetData(name: string, value: any): Promise<void>;
export function GetData(name: string): any;
export function getState(property: string): any;
export function subscribeToState(
	property: string,
	callback: (eventDetail: StateEventDetail) => void
): () => void;
export function registerComponentHook(
	componentType: string,
	hookFunction: (component: HTMLElement) => void
): void;

// Flow keywords (available in flow context)
export function Query(options: any): Promise<any>;
export function Navigate(
	path: string,
	options?: { triggeredBy?: string; element?: Element }
): void;
export function Alert(options?: {
	message?: string;
	title?: string;
	dispose?: boolean;
}): Promise<void>;
export function Confirm(options?: {
	message?: string;
	title?: string;
	dispose?: boolean;
}): Promise<void>;
export function Trigger(
	flowKey: string,
	data?: any,
	options?: { triggeredBy?: string; flowStack?: string[]; element?: Element }
): Promise<void>;

// Router functionality
export function Router(config?: {
	beforeEach?: (context: any) => Promise<void>;
	afterEach?: (context: any) => Promise<void>;
	basePath?: string;
	initialPath?: string;
	activePathKey?: string;
}): {
	beforeEach?: (context: any) => Promise<void>;
	afterEach?: (context: any) => Promise<void>;
	basePath?: string;
	initialPath?: string;
	activePathKey?: string;
	registerWithFramework(frameworkCore: any): Promise<void>;
	triggerInitialNavigation(): Promise<void>;
	updateActivePath(path: string): void;
	getCurrentPath(): string | undefined;
	getPreviousPath(): string | undefined;
};

// HTML template utility
export function html(strings: TemplateStringsArray, ...values: any[]): string;

// Base component class for custom components
export class BaseUIComponent extends HTMLElement {
	stateSubscriptions: Map<string, () => void>;
	initialState: FrameworkState | null;
	originalAttributes: Map<string, string>;

	constructor();
	connectedCallback(): void;
	disconnectedCallback(): void;
	getCurrentState(): FrameworkState;
	storeOriginalAttributes(): void;
	setupStateSubscriptions(): void;
	handleStateChange(newState: FrameworkState): void;
	applyConditionalAttributes(): void;
	applySxStyles(): void;
	expandShorthandProperty(
		property: string,
		value: string
	): Record<string, string>;
}

// Global declarations for browser environment
declare global {
	interface Window {
		state: FrameworkState;
		subscribeToState: (
			property: string,
			callback: (eventDetail: StateEventDetail) => void
		) => () => void;
	}
}
