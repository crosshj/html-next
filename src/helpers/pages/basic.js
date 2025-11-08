const html = String.raw;
const appHTML = ({ logoHTML }) =>
	html`
		<x-page>
			<x-data name="mainContent"></x-data>

			<x-data name="menuItems"></x-data>

			<x-data name="menuItemsBottom"></x-data>

			<x-data name="activePath"></x-data>

			<x-box class="app-layout">
				<x-box
					id="sidebar"
					class="fade-right"
					onclick="document.getElementById('sidebar')?.classList?.remove('open')"
				>
					<div>
						<x-box sx:height="75px" sx:display="flex" sx:align-items="center">
							${logoHTML || ''}
						</x-box>
						<x-box
							sx:display="flex"
							sx:flex-direction="column"
							sx:gap="8px"
							sx:flex-grow="1"
						>
							<x-map items="global_menuItems">
								<x-button
									class="menuItem"
									href="{{item_href}}"
									variant="text"
									icon="{{item_icon}}"
									sx:justify-content="flex-start"
									fullWidth
								>
									{{ item_label }}
								</x-button>
							</x-map>
							<x-box sx:flex-grow="1"></x-box>
							<x-map items="global_menuItemsBottom">
								{{#if item_hasAvatar}}
								<x-box class="menuItem">
									<x-link href="{{item_href}}" underline="none">
										<x-box class="menuItem-avatar">
											<img src="{{item_avatar}}" class="avatar-image" />
											<span> {{ item_label }} </span>
										</x-box>
									</x-link>
								</x-box>
								{{/if}} {{#if item_icon}}
								<x-button
									class="menuItem"
									href="{{item_href}}"
									variant="text"
									icon="{{item_icon}}"
									sx:justify-content="flex-start"
									fullWidth
								>
									{{ item_label }}
								</x-button>
								{{/if}}
							</x-map>
							<x-box sx:mb="1"></x-box>
						</x-box>
					</div>
				</x-box>
				<x-box id="main">
					<x-fragment
						contents="global_mainContent"
						showLoading="false"
					></x-fragment>
				</x-box>
			</x-box>
		</x-page>
	`.trim();

export default async (args) => {
	const { framework, logoHTML, getFragment, getData, getMenu, defaultHash } =
		args;
	const { initializeFramework, Router, SetData } = framework;

	const cache = new Map();
	const fetchPage = async (path) => {
		if (cache.has(path)) return cache.get(path);
		try {
			const response = await getFragment(path);
			const result = await response.text().then((x) => x.trim());
			if (!result.trim()) {
				throw new Error('Page not found');
			} else {
				cache.set(path, result.trim());
				return result.trim();
			}
		} catch (error) {
			console.error(`Failed to fetch page from ${path}:`, error);
			if (path === '404') {
				return '<x-page><x-content><x-markdown>Fetch page: Not Found</x-markdown></x-content></x-page>';
			}
			return await fetchPage('404');
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
		}
	};
	const routerSetup = async () => {
		const initialHash = window.location.hash || defaultHash;
		const initialPath = initialHash.replace(/^#/, '');

		return Router({
			initialPath,
			beforeEach: async (context) => {
				const path = context.to.href;
				await SetData('mainContent', await fetchPage(path));
			},
			afterEach: async (context) => {
				const path = context.to.href;
				document.querySelectorAll('.menuItem.active').forEach((button) => {
					button.classList.remove('active');
				});
				const menuItems = document.querySelectorAll('.menuItem');
				for (const item of menuItems) {
					const href = item.getAttribute('href');
					if (!path.startsWith(href)) continue;
					item.classList.add('active');
				}
				document.getElementById('sidebar')?.classList?.remove('open');

				// Handle navigation after all other updates
				window.location.hash = context.to.path;
			},
		});
	};

	const router = await routerSetup();
	const menuData = await getMenu();

	const state = {
		appContent: appHTML({ logoHTML }),
		mainContent: '',
		menuItems: menuData.top,
		menuItemsBottom: menuData.bottom,
	};
	const hooks = {
		'x-markdown': (component) => {
			if (typeof hljs === 'undefined') return;

			const codeBlocks = component.querySelectorAll('pre code');
			for (const codeBlock of codeBlocks) {
				hljs.highlightElement(codeBlock);
			}
		},
	};
	await initializeFramework({ router, state, hooks });
	document.body.classList.add('framework-loaded');
};
