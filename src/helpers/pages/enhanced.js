const html = String.raw;
const appHTML = ({ logoHTML }) =>
	html`
		<x-page>
			<x-data name="mainContent"></x-data>

			<!-- Menu Items - loaded from state -->
			<x-data name="menuItems"></x-data>
			<x-data name="menuItemsBottom"></x-data>

			<!-- Theme Settings -->
			<x-data name="themeSettings"></x-data>
			<x-subscribe path="themeSettings" handler="themeChanged"></x-subscribe>
			<script type="application/flow" data-key="themeChanged">
				if (typeof window.setTheme !== 'function') return;
				const themeMode = state?.themeSettings?.mode || 'light';
				window.setTheme(themeMode);
			</script>

			<!-- Logout flow -->
			<script type="application/flow" data-key="logout">
				const confirmed = await Confirm({
					title: 'Logout',
					message: 'Are you sure you want to logout?',
				});

				if (!confirmed) return false;

				try {
					await SetData('appContent', '');
					// Call logout API
					await window.auth.signOut();
					await new Promise((resolve) => setTimeout(resolve, 500));
					document.location.reload();
				} catch (error) {
					console.error('Logout error:', error);
				}
			</script>

			<x-data name="menuItemSelected" defaultValue="0"></x-data>
			<script type="application/flow" data-key="onMenuSelect">
				document.getElementById('sidebar')?.classList?.remove('open');
			</script>

			<style>
				#app-menu {
					& > div {
						display: contents;
					}
				}
				#sidebar > div {
					height: 100%;
					width: 250px;
					background: var(--palettePrimaryNavbar);

					padding-inline: 16px;
					display: flex;
					flex-direction: column;
					gap: 12px;

					.is-selected {
						.menuItem button,
						.menuItem .menuItem-avatar {
							--bg-color: color-mix(
								in srgb,
								var(--palettePrimaryMain) 80%,
								var(--palettePrimaryNavbar)
							);
							background: var(--bg-color);
							border-color: var(--bg-color);
							color: var(--palettePrimaryContrast);
							&:hover {
								background: var(--bg-color);
							}
						}
					}

					.menuItem {
						border-radius: var(--radius-sm);

						button,
						.menuItem-avatar {
							color: var(--paletteTextPrimary);
							&:hover {
								background: color-mix(
									in srgb,
									var(--palettePrimaryNavbar) 70%,
									var(--palettePrimaryMain)
								);
							}
						}
						.fa,
						.fas,
						.far,
						.fal,
						.fad,
						.fab {
							color: inherit;
							opacity: 0.6;
						}
					}
				}
			</style>

			<x-box class="app-layout">
				<x-box
					id="sidebar"
					class="fade-rightDISABLED"
					onclick="this?.classList?.remove('open')"
				>
					<div>
						<x-box
							sx:height="75px"
							sx:display="flex"
							sx:align-items="center"
							sx:px="0.5em"
						>
							${logoHTML || ''}
						</x-box>
						<x-box
							sx:display="flex"
							sx:flex-direction="column"
							sx:gap="8px"
							sx:flex-grow="1"
						>
							<!-- prettier-ignore -->
							<x-map
								id="app-menu"
								items="global_menuItems"
								selectMode="single"
								selected="global_menuItemSelected"
								onSelect="onMenuSelect"
							>
								{{#if item_icon}}
								<x-button
									class="menuItem"
									href="{{item_path}}"
									variant="text"
									icon="{{item_icon}}"
									sx:justify-content="flex-start"
									fullWidth
								>
									{{ item_label }}
								</x-button>
								{{/if}} 
								
								{{#if item_spacer}}
								<x-box
									sx:flex-grow="1"
									sx:pointer-events="none"
								></x-box>
								{{/if}}

								{{#if item_hasAvatar}}
								<x-box
									class="menuItem"
									href="{{item_path}}"
								>
									<x-link
										href="{{item_path}}"
										underline="none"
									>
										<x-box class="menuItem-avatar">
											<img
												src="{{item_avatar}}"
												class="avatar-image"
											/>
											<span> {{ item_label }} </span>
										</x-box>
									</x-link>
								</x-box>
								{{/if}} 
							</x-map>
							<x-box sx:mb="1"></x-box>
						</x-box>
					</div>
				</x-box>
				<x-box id="main">
					<x-fragment
						contents="global_mainContent"
						showLoading="true"
					></x-fragment>
				</x-box>
			</x-box>
		</x-page>
	`.trim();
const authHTML = ({ logoHTML }) =>
	html`
		<x-page>
			<x-subscribe path="pageLoaded" handler="showLoginForm"></x-subscribe>

			<x-data name="formData"></x-data>

			<x-data name="currentTemplate" defaultValue=""></x-data>

			<!-- Template switching scripts -->
			<script type="application/flow" data-key="showSignupForm">
				const signupTemplate = document.getElementById('signupTemplate');
				if (signupTemplate) {
					SetData('currentTemplate', signupTemplate.innerHTML);
				}
			</script>

			<script type="application/flow" data-key="showLoginForm">
				const loginTemplate = document.getElementById('loginTemplate');
				if (loginTemplate) {
					SetData('currentTemplate', loginTemplate.innerHTML);
				}
			</script>

			<template id="loginTemplate">
				<!-- Login form schema -->
				<x-schema name="loginSchema">
					email: string, required, min:1 password: string, required, min:8
				</x-schema>

				<script type="application/flow" data-key="handleLogin">
					// Get the form and validate manually against login schema
					const form = document.querySelector('x-form[name="loginForm"]');
					if (!form) {
						console.error('Login form not found');
						return;
					}

					// Set the schema and validate
					form.setAttribute('schema', 'loginSchema');
					form.markAsSubmitted();

					// Check if form is valid
					if (!form.isValid) {
						await Alert({
							title: 'Validation Error',
							message: 'Please fix the errors in the form before submitting.'
						});
						return;
					}

					// Get values from form data
					const formData = state.formData;
					const { email, password } = formData;

					// Clear template to show loading spinner
					SetData('currentTemplate', '');

					try {
						const res = await window.auth.signIn(email, password);
						if(res?.error){
							throw new Error(res.error.message);
						}
						await new Promise((resolve) => setTimeout(resolve, 500));
						document.location.reload();
					} catch (error) {
						// Restore login form on network error
						const loginTemplate = document.getElementById('loginTemplate');
						if (loginTemplate) {
							SetData('currentTemplate', loginTemplate.innerHTML);
						}
						await Alert({
							title: 'Network Error',
							message: 'Please check your connection and try again.'
						});
					}
				</script>

				<x-form name="loginForm" data="global_formData">
					<x-box sx:mb="2" sx:mt="2">
						<input
							id="loginForm-email"
							label="Email"
							name="email"
							type="email"
							placeholder="Enter your email"
							required
							autocomplete="email"
						/>
					</x-box>

					<x-box sx:mb="3">
						<input
							id="loginForm-password"
							label="Password"
							name="password"
							type="password"
							placeholder="Enter your password"
							required
							autocomplete="current-password"
						/>
					</x-box>
				</x-form>

				<x-box
					sx:mb="2"
					sx:mt="2"
					sx:display="flex"
					sx:justify-content="center"
				>
					<x-button
						label="Sign In"
						variant="primary"
						fullWidth
						handler="handleLogin"
					></x-button>
				</x-box>

				<x-box sx:text-align="center" sx:mt="3">
					<p style="margin: 0; color: var(--paletteTextSecondary)">
						Don't have an account?
						<x-button
							label="Sign up here"
							variant="link"
							handler="showSignupForm"
						></x-button>
					</p>
				</x-box>
			</template>

			<template id="signupTemplate">
				<!-- Signup form schema -->
				<x-schema name="signupSchema">
					email: string, required, min:1 password: string, required, min:8
				</x-schema>

				<script type="application/flow" data-key="handleSignup">
					const form = document.querySelector('x-form[name="signupForm"]');
					if (!form) {
						console.error('Signup form not found');
						return;
					}

					// Set the schema and validate
					form.setAttribute('schema', 'signupSchema');
					form.markAsSubmitted();

					// Check if form is valid
					if (!form.isValid) {
						await Alert({
							title: 'Validation Error',
							message: 'Please fix the errors in the form before submitting.'
						});
						return;
					}

					// Get values from form data
					const formData = state.formData;
					const { email, password } = formData;

					// Clear template to show loading spinner
					SetData('currentTemplate', '');

					try {
						const res = await window.auth.signUp(email, password);
						if(res?.error){
							throw new Error(res.error.message);
						}
						await new Promise((resolve) => setTimeout(resolve, 500));
						document.location.reload();
					} catch (error) {
						// Restore signup form on network error
						const signupTemplate = document.getElementById('signupTemplate');
						if (signupTemplate) {
							SetData('currentTemplate', signupTemplate.innerHTML);
						}
						await Alert({
							title: 'Signup Error',
							message: 'Please check your details and try again.'
						});
					}
				</script>

				<x-form name="signupForm" data="global_formData">
					<x-box sx:mb="2">
						<input
							id="signupForm-email"
							label="Email"
							name="email"
							type="email"
							placeholder="Enter your email"
							required
							autocomplete="email"
						/>
					</x-box>

					<x-box sx:mb="3">
						<input
							id="signupForm-password"
							label="Password"
							name="password"
							type="password"
							placeholder="Create a password (min 8 characters)"
							required
							autocomplete="new-password"
						/>
					</x-box>
				</x-form>

				<x-box
					sx:mb="2"
					sx:mt="2"
					sx:display="flex"
					sx:justify-content="center"
				>
					<x-button
						label="Create Account"
						variant="primary"
						fullWidth
						handler="handleSignup"
					></x-button>
				</x-box>

				<x-box sx:text-align="center" sx:mt="3">
					<p style="margin: 0; color: var(--paletteTextSecondary)">
						Already have an account?
						<x-button
							label="Sign in here"
							variant="link"
							handler="showLoginForm"
						></x-button>
					</p>
				</x-box>
			</template>

			<x-content>
				<x-box
					sx:width="100%"
					sx:max-width="400px"
					sx:margin="0 auto"
					sx:mt="10"
				>
					<x-box
						sx:height="200px"
						sx:display="flex"
						sx:align-items="center"
						sx:mb="4"
						class="logo-container"
					>
						${logoHTML || ''}
					</x-box>

					<!-- Single fragment that renders the current template content -->
					<x-fragment contents="global_currentTemplate"></x-fragment>
				</x-box>
			</x-content>

			<x-data name="pageLoaded" defaultValue="true"></x-data>
		</x-page>
	`.trim();

export default async (args) => {
	const {
		framework,
		authSetup,
		logoHTML,
		getFragment,
		getData,
		getMenu,
		defaultHash,
	} = args;

	const requiredArgs = {
		framework,
		authSetup,
		logoHTML,
		getFragment,
		getData,
		getMenu,
		defaultHash,
	};
	const missingArgs = Object.entries(requiredArgs)
		.filter(([_, value]) => !value)
		.map(([key]) => key);
	if (missingArgs.length > 0) {
		throw new Error(`Missing required arguments: ${missingArgs.join(', ')}`);
	}

	const { initializeFramework, Router, SetData, Trigger } = framework;

	const fallback404 = () => document.getElementById('fallback404').innerHTML;

	const setTheme = function (themeMode) {
		const storedTheme = localStorage.getItem('theme-mode');
		if (!themeMode) {
			if (!storedTheme) {
				const prefersDark = window.matchMedia(
					'(prefers-color-scheme: dark)'
				).matches;
				themeMode = prefersDark ? 'dark' : 'light';
			} else {
				themeMode = storedTheme;
			}
		}
		if (!document.documentElement.classList.contains(themeMode)) {
			document.documentElement.classList.remove('light');
			document.documentElement.classList.remove('dark');
			document.documentElement.classList.add(themeMode);
		}
		if (storedTheme !== themeMode) {
			localStorage.setItem('theme-mode', themeMode);
		}
		const metaThemeColor = document.getElementById('theme-color-meta');
		if (metaThemeColor) {
			const newContent = themeMode === 'dark' ? '#101217' : '#fcfcfc';
			if (metaThemeColor.getAttribute('content') !== newContent) {
				metaThemeColor.setAttribute('content', newContent);
			}
		}
	};

	const routerSetup = async () => {
		const initialHash = window.location.hash || '#/dashboard';
		const initialPath = initialHash.replace(/^#/, '');

		const cache = new Map();
		const fetchFragment = async (path) => {
			if (path === '404') {
				return fallback404();
			}
			if (cache.has(path)) return cache.get(path);
			try {
				const response = await getFragment(path);
				const result = await response.text().then((x) => x.trim());
				if (!result.trim()) {
					throw new Error('Fragment not found');
				} else {
					cache.set(path, result.trim());
					return result.trim();
				}
			} catch (error) {
				console.error(`Failed to fetch fragment from ${path}:`, error);
				return fallback404();
			}
		};
		const fetchData = async (path, defaultValue = {}) => {
			if (cache.has(path)) return cache.get(path);
			try {
				const response = await getData(path);
				const result = await response.json();
				cache.set(path, result);
				return result;
			} catch (error) {
				console.error(`Failed to fetch JSON from ${path}:`, error);
				return defaultValue;
			}
		};

		const handleNavigation = async () => {
			SetData('mainContent', '');
			const newHash = window.location.hash || '#/dashboard';
			const newPath = newHash.replace(/^#/, '');
			await SetData('activePath', newPath);
			const content = await fetchFragment(newPath.replace(/^\//, ''));
			await SetData('mainContent', content);
		};

		window.addEventListener('hashchange', handleNavigation);

		const beforeEach = async (context) => {
			if (context.to.href === '/logout') {
				cache.clear();
				await Trigger('logout'); //defined in _app.html
				return false;
			}

			if (context.to.href === window.location.hash.replace(/^#/, '')) {
				handleNavigation();
			} else {
				window.location.hash = context.to.path;
			}
		};

		return Router({
			initialPath,
			beforeEach,
		});
	};

	setTheme();
	window.setTheme = setTheme;
	const router = await routerSetup();

	const auth = authSetup();
	window.auth = auth;
	const { data: { session } = {} } = await auth.getSession();

	const appContent = session ? appHTML({ logoHTML }) : authHTML({ logoHTML });
	const menuItems = getMenu({ user: session?.user });
	const newHash = window.location.hash || defaultHash;
	const newPath = newHash.replace(/^#/, '');
	const menuItemSelected = menuItems.findIndex((item) => item.path === newPath);

	const state = {
		appContent,
		mainContent: '',
		menuItems,
		menuItemSelected,
		themeSettings: {
			mode: document.documentElement.classList.contains('dark')
				? 'dark'
				: 'light',
		},
		contentLoaded: false,
	};

	const hooks = {};
	await initializeFramework({ router, state, hooks });

	document.body.classList.add('framework-loaded');
};
