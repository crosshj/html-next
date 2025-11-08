# HTMLNext

Imagine something like React + Material-UI without painful setup, build systems, or complexity. Just HTML, CSS, and ~42kB JS.

Build interactive apps with custom elements and reactive state using web standards browsers already support.

## Features

- 🎨 **HTML/CSS First** - No JSX, no build step, just web standards
- 🔄 **Reactive State** - UI updates automatically when data changes
- 🧩 **Custom Elements** - Reusable components that work like native HTML
- ⚡ **Minimal Dependencies** - Just include files and start coding
- 🚀 **Small Footprint** - Complete framework in ~42kB JS + ~8kB CSS (gzipped)

## Quick Start

Copy this code into an html file and open it in your browser.

<!-- prettier-ignore -->
```html
<!DOCTYPE html>
<html>
	<head>
		<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
		<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@crosshj/html-next@latest/dist/htmlNext.css" />
	</head>

	<style>
		/* basic override of theme colors */
		:root body {
			--palettePrimaryMain: #007bff;
			--palettePrimaryLight: #66b3ff;
			--palettePrimaryDark: #0056b3;
		}
		body {
			padding-top: 4em;
			height: 100vh;
			width: 100vw;
		}
		.loading { visibility: hidden; }
		.flex-row-gap-1 { display: flex; gap: 1em; }
		.flex-column-gap-1 { display: flex; flex-direction: column; gap: 1em; }
		.align-center { align-items: center; }
		.justify-center { justify-content: center; }
		x-fragment pre { margin: 0; min-width: 5em; }
	</style>

	<body class="loading flex-column-gap-1 align-center">
		<x-data name="count" defaultValue="0"></x-data>

		<script data-key="increment" type="application/flow">
			SetState('count', ++state.count);
		</script>

		<script data-key="decrement" type="application/flow">
			SetState('count', --state.count);
		</script>

		<x-typography variant="h1">Count Demo</x-typography>
		<x-box class="flex-row-gap-1">
			<x-button handler="decrement" icon="fa-minus" sx:height="100%"></x-button>
			<x-fragment contents="global_count" class="flex-row-gap-1 justify-center"></x-fragment>
			<x-button handler="increment" icon="fa-plus" sx:height="100%"></x-button>
		</x-box>

		<script type="module">
			import { initializeFramework } from 'https://cdn.jsdelivr.net/npm/@crosshj/html-next@latest/dist/htmlNext.min.js';
			initializeFramework();
			document.body.classList.remove('loading');
		</script>
	</body>
</html>
```

## Development

If you want to see a fairly involved example, pull the repo and run locally.

```bash
git clone https://github.com/crosshj/html-next.git
cd html-next
npm install
npm run dev
# see /demo/index.html
```

## License

MIT

## Repository

- **GitHub**: [https://github.com/crosshj/html-next](https://github.com/crosshj/html-next)
- **Issues**: [https://github.com/crosshj/html-next/issues](https://github.com/crosshj/html-next/issues)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
