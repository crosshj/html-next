// Framework Router - Lifecycle hooks for navigation
export function Router(config = {}) {
	const {
		beforeEach,
		afterEach,
		basePath = '',
		initialPath,
		activePathKey = 'activePath',
	} = config;

	// Return router instance that can be passed to framework initialization
	return {
		beforeEach,
		afterEach,
		basePath,
		initialPath,
		activePathKey,

		// Method to register router with framework
		async registerWithFramework(frameworkCore) {
			// Register routerNavigate as a system flow with proper context
			frameworkCore.registerFlow(
				{ key: 'routerNavigate' },
				`
				// Extract href from event context
				let href = null;
				
				// Try to get href from different sources
				if (event.element && event.element.getAttribute) {
					href = event.element.getAttribute('href');
				}
				if (!href && event.data && event.data.href) {
					href = event.data.href;
				}
				if (!href && event.href) {
					href = event.href;
				}
				
				if (!href) {
					console.warn('routerNavigate: No href found in event context');
					return;
				}
				
				// Build route context
				const currentPath = state.router?.currentPath || window.location.hash || '#/';
				const toPath = href.startsWith('#') ? href : '#' + href;
				
				const routeContext = {
					to: { path: toPath, href: href },
					from: { path: currentPath },
					cancel: () => { throw new Error('Navigation cancelled'); }
				};
				
				// Call beforeEach hook if provided
				if (typeof routerBeforeEach === 'function') {
					try {
						await routerBeforeEach(routeContext);
					} catch (error) {
						if (error.message === 'Navigation cancelled') {
							console.log('Navigation cancelled by beforeEach hook');
							return;
						}
						throw error;
					}
				}
				
				// Update router state
				SetData('router.previousPath', currentPath);
				SetData('router.currentPath', toPath);
				
				// Call afterEach hook if provided
				if (typeof routerAfterEach === 'function') {
					await routerAfterEach(routeContext);
				}
				
				
				// Update activePath
				const cleanPath = toPath.startsWith('#') ? toPath.substring(1) : toPath;
				SetData('activePath', cleanPath);
				`
			);

			// Initialize router state with provided initial path
			const currentPath =
				this.initialPath || window.location.hash || '#/dashboard';
			const cleanPath = currentPath.startsWith('#')
				? currentPath.substring(1)
				: currentPath;

			// Set initial router state
			frameworkCore.SetData('router.currentPath', currentPath);
			frameworkCore.SetData('router.previousPath', '');
			frameworkCore.SetData(this.activePathKey, cleanPath);

			// Store initial path for later execution after DOM is ready
			this._initialPath = currentPath;
		},

		// Method to trigger initial navigation after DOM is ready
		async triggerInitialNavigation() {
			if (this._initialPath) {
				const initialRouteContext = {
					to: { path: this._initialPath, href: this._initialPath },
					from: { path: '' },
					cancel: () => {
						throw new Error('Navigation cancelled');
					},
				};

				// Call beforeEach hook if provided (wrapped in requestAnimationFrame)
				if (typeof this.beforeEach === 'function') {
					try {
						await new Promise((resolve) => {
							requestAnimationFrame(async () => {
								try {
									await this.beforeEach(initialRouteContext);
									resolve();
								} catch (error) {
									if (error.message === 'Navigation cancelled') {
										console.log(
											'Initial navigation cancelled by beforeEach hook'
										);
										resolve();
									} else {
										throw error;
									}
								}
							});
						});
					} catch (error) {
						if (error.message === 'Navigation cancelled') {
							console.log('Initial navigation cancelled by beforeEach hook');
							return;
						} else {
							throw error;
						}
					}
				}

				// Call afterEach hook if provided (wrapped in requestAnimationFrame)
				if (typeof this.afterEach === 'function') {
					await new Promise((resolve) => {
						requestAnimationFrame(async () => {
							await this.afterEach(initialRouteContext);
							resolve();
						});
					});
				}
			}
		},

		// Method to update activePath (can be called from beforeEach hook)
		updateActivePath(path) {
			if (frameworkCore) {
				frameworkCore.SetData(this.activePathKey, path);
			}
		},

		// Utility methods
		getCurrentPath: () => frameworkCore?.get('router.currentPath'),
		getPreviousPath: () => frameworkCore?.get('router.previousPath'),
	};
}
