// Type definitions for HTMLNext Helpers

/**
 * Arguments passed to page helper functions
 */
export interface PageHelperArgs {
	/** Framework exports (initializeFramework, Router, SetData, etc.) */
	framework: any;
	/** Optional HTML string for logo display */
	logoHTML?: string;
	/** Function to fetch page fragments */
	getFragment: (path: string) => Promise<Response>;
	/** Function to fetch JSON data */
	getData: (path: string) => Promise<Response>;
	/** Function to fetch menu configuration */
	getMenu: () => Promise<{ top: any[]; bottom: any[] }>;
	/** Default hash/route when page loads */
	defaultHash?: string;
}

/**
 * Page helper function type
 */
export type PageHelper = (args: PageHelperArgs) => Promise<void>;

/**
 * Basic page helper - sets up a page with sidebar navigation
 */
export const pages: {
	basic: PageHelper;
};

declare const helpers: {
	pages: typeof pages;
};

export default helpers;
