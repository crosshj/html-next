# HTMLNext

A lightweight web component framework with state management and conditional rendering. Built for modern web applications that need a simple, powerful way to create interactive UIs without heavy frameworks.

## Features

- 🧩 **Web Components** - Custom elements that work with any framework
- 🔄 **State Management** - Reactive state system with subscriptions
- 🎨 **Conditional Rendering** - Dynamic UI based on state
- 📱 **Mobile Ready** - Works great on mobile devices
- 🚀 **Zero Dependencies** - No external dependencies
- 📦 **Tree Shakable** - Import only what you need
- 🎯 **TypeScript Support** - Full type definitions included

## Installation

### NPM

```bash
npm install @crosshj/html-next
```

### CDN

```html
<!-- CSS -->
<link
	rel="stylesheet"
	href="https://cdn.jsdelivr.net/npm/@crosshj/html-next@latest/dist/htmlNext.css"
/>

<!-- JavaScript -->
<script type="module">
	import { initializeFramework } from 'https://cdn.jsdelivr.net/npm/@crosshj/html-next@latest/dist/htmlNext.js';
	initializeFramework();
</script>
```

## Quick Start

```html
<!DOCTYPE html>
<html>
	<head>
		<link
			rel="stylesheet"
			href="https://cdn.jsdelivr.net/npm/@crosshj/html-next@latest/dist/htmlNext.css"
		/>
	</head>
	<body>
		<x-page>
			<x-content>
				<x-box>
					<x-typography variant="h1">Hello X-Framework!</x-typography>
					<x-button onclick="alert('Clicked!')">Click me</x-button>
				</x-box>
			</x-content>
		</x-page>

		<script type="module">
			import { initializeFramework } from 'https://cdn.jsdelivr.net/npm/@crosshj/html-next@latest/dist/htmlNext.js';
			initializeFramework();
		</script>
	</body>
</html>
```

## Usage

### ES Modules (Recommended)

```javascript
import {
	initializeFramework,
	setState,
	getState,
	subscribeToState,
	html,
	BaseUIComponent,
} from '@crosshj/html-next';

// Initialize the framework
initializeFramework();

// Set state
setState('user', { name: 'John', age: 30 });

// Get state
const user = getState('user');

// Subscribe to state changes
const unsubscribe = subscribeToState('user', (event) => {
	console.log('User changed:', event.newValue);
});

// Use html template utility
const template = html`<div>Hello ${user.name}!</div>`;
```

### State Management

```javascript
import { setState, getState, subscribeToState } from '@crosshj/html-next';

// Set state
setState('count', 0);

// Get state
const count = getState('count');

// Subscribe to state changes
const unsubscribe = subscribeToState('count', (event) => {
	console.log('Count changed:', event.newValue);
});

// Unsubscribe when done
unsubscribe();
```

### Conditional Rendering

```html
<!-- Show/hide based on state -->
<x-box sx:display="WHEN global_isVisible THEN block ELSE none">
	Content here
</x-box>

<!-- Conditional classes -->
<x-button
	className="WHEN global_isActive THEN active ELSE inactive"
	sx:backgroundColor="WHEN global_isActive THEN green500 ELSE grey300"
>
	Button
</x-button>
```

### Custom Components

```javascript
import { BaseUIComponent } from '@crosshj/html-next';

class MyComponent extends BaseUIComponent {
	connectedCallback() {
		this.innerHTML = '<h2>My Custom Component</h2>';
	}
}

customElements.define('my-component', MyComponent);
```

## Components

### Layout Components

- `x-page` - Main page container
- `x-content` - Content area
- `x-box` - Generic container with styling props
- `x-navbar` - Navigation bar

### UI Components

- `x-button` - Button with variants
- `x-typography` - Text with typography variants
- `x-link` - Link component
- `x-icon` - Icon component
- `x-table` - Data table

### Data Components

- `x-data` - Data source definition
- `x-subscribe` - State subscription
- `x-flow` - Flow execution
- `x-map` - Template mapping

### Utility Components

- `x-fragment` - Fragment container
- `x-include` - Include external content
- `x-markdown` - Markdown rendering

## Styling

### SX Props

Use `sx:` prefixed attributes for inline styling:

```html
<x-box
	sx:padding="16"
	sx:backgroundColor="blue500"
	sx:borderRadius="8"
	sx:display="flex"
	sx:flexDirection="column"
>
	Content
</x-box>
```

### Color System

Use Material Design color names:

```html
<x-button sx:backgroundColor="green500">Success</x-button>
<x-button sx:backgroundColor="red500">Danger</x-button>
<x-button sx:backgroundColor="blue500">Primary</x-button>
```

### Spacing Scale

Numbers are multiplied by 8px:

```html
<x-box sx:padding="2">16px padding</x-box>
<x-box sx:margin="4">32px margin</x-box>
```

## State Management

### Setting State

```javascript
import { setState } from '@crosshj/html-next';

// Simple values
setState('count', 42);
setState('user', { name: 'John', age: 30 });
setState('items', ['apple', 'banana', 'orange']);
```

### Getting State

```javascript
import { getState } from '@crosshj/html-next';

const count = getState('count');
const user = getState('user');
```

### Subscribing to Changes

```javascript
import { subscribeToState } from '@crosshj/html-next';

const unsubscribe = subscribeToState('count', (event) => {
	console.log('Count changed from', event.oldValue, 'to', event.newValue);
	// Update UI here
});
```

## Flows

Flows are JavaScript functions that execute when state changes:

```html
<x-flow key="updateCounter">
	// This code runs when triggered const count = state.count || 0;
	setData('count', count + 1);
</x-flow>

<x-subscribe path="buttonClicked" handler="updateCounter">
	<x-button>Increment</x-button>
</x-subscribe>
```

## Browser Support

- Chrome 67+
- Firefox 63+
- Safari 11+
- Edge 79+

## Development

```bash
# Install dependencies
npm install

# Build the framework
npm run build

# Watch mode for development
npm run dev

# Just serve the test app
npm run dev:test
```

## GitHub Actions

This repository includes a simple GitHub Actions workflow for publishing to npm:

- **Triggers**: Push to main branch or manual trigger
- **Smart version checking**: Only publishes if the version doesn't already exist on npm
- **Automatic git tagging**: Creates version tags automatically

### Workflow Steps

1. **Reads version from `package.json`** - Uses the version specified in your package.json file
2. **Checks if version exists** - Queries npm to see if that version is already published
3. **Publishes only if new** - Only publishes if the version doesn't exist on npm
4. **Creates git tag** - Automatically tags the commit with `v{version}` (e.g., `v1.0.0`)
5. **Skips if exists** - If the version already exists, skips publishing and logs a message

### Setting up NPM Publishing

1. Create an NPM access token:
   - Go to [npmjs.com](https://www.npmjs.com) and log in
   - Go to "Access Tokens" in your account settings
   - Click "Generate New Token"
   - Choose "Automation" type for CI/CD
   - Copy the token

2. Add the token as a GitHub secret:
   - Go to your GitHub repository settings
   - Navigate to "Secrets and variables" → "Actions"
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Your NPM access token

3. The workflow will automatically run when you:
   - Push to the `main` branch
   - Create a release tag (e.g., `v1.0.0`)
   - Manually trigger the workflow

### Version Management

- **Update version**: Change the version in `package.json` and push to main
- **Automatic tagging**: The workflow will create a git tag like `v1.0.0`
- **No duplicates**: Won't publish if the version already exists on npm
- **Safe reruns**: You can safely rerun the workflow without worrying about duplicate publishes

## License

MIT

## Repository

- **GitHub**: [https://github.com/crosshj/html-next](https://github.com/crosshj/html-next)
- **Issues**: [https://github.com/crosshj/html-next/issues](https://github.com/crosshj/html-next/issues)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Changelog

### 1.0.0

- Initial release
- Web components
- State management
- Conditional rendering
- SX styling system
