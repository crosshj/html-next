# HTMLNext

React + Material-UI without JSX, build systems, or complexity. Just HTML, CSS, and ~23kB JS.

Build interactive apps with custom elements and reactive state using web standards browsers already support.

## Features

- 🎨 **HTML/CSS First** - No JSX, no build step, just web standards
- 🔄 **Reactive State** - UI updates automatically when data changes
- 🧩 **Custom Elements** - Reusable components that work like native HTML
- ⚡ **Zero Dependencies** - Just include files and start coding
- 🚀 **Small Footprint** - Complete framework in 23kB JS + 6kB CSS

## Quick Start

<!-- prettier-ignore -->
```html
<!DOCTYPE html>
<html>
    <head>
        <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/@crosshj/html-next@latest/dist/htmlNext.css"
        />
    </head>
    <body>
        <template id="appContent">
            <x-data name="count" defaultValue="1"></x-data>
            <x-data name="isVisible" defaultValue="true"></x-data>

            <x-flow key="increment">
                SetState('count', state.count + 1);
            </x-flow>
            <x-flow key="toggle">
                SetState('isVisible', !(state.isVisible+'' === 'true'));
            </x-flow>

            <x-box>
                <x-typography variant="h1">Count Demo</x-typography>
                <x-box
                    sx:display="flex"
                    sx:gap="1"
                    sx:align-items="center"
                    sx:visibility="WHEN global_isVisible THEN visible ELSE hidden"
                >
                    <x-typography variant="h3">Count: </x-typography>
                    <x-fragment contents="global_count"></x-fragment>
                    <x-button handler="increment" icon="fa-plus"> Increment </x-button>
                </x-box>
                <x-button
                    handler="toggle"
                    icon="fa-eye"
                    sx:color="brown500"
                    variant="outlined"
                >
                    Toggle Visibility
                </x-button>
            </x-box>
        </template>

        <x-fragment contents="global_appContent"></x-fragment>

        <script type="module">
            import {
                initializeFramework,
                SetState,
            } from 'https://cdn.jsdelivr.net/npm/@crosshj/html-next@latest/dist/htmlNext.js';
            initializeFramework();
            // loaded from template here, but could be loaded from network
            const appContent = document.getElementById('appContent').innerHTML;
            SetState('appContent', appContent);
        </script>
    </body>
</html>
```

## Development

```bash
# clone this repo, then...
npm install
# Development watch mode (see /demo/index.html)
npm run dev
```

## License

MIT

## Repository

- **GitHub**: [https://github.com/crosshj/html-next](https://github.com/crosshj/html-next)
- **Issues**: [https://github.com/crosshj/html-next/issues](https://github.com/crosshj/html-next/issues)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
