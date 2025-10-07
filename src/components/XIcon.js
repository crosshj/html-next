import { BaseUIComponent } from './BaseUIComponent.js';

// Define x-icon web component
export class XIcon extends BaseUIComponent {
	constructor() {
		super();
	}

	connectedCallback() {
		// Call parent connectedCallback first to handle sx: styles
		super.connectedCallback();

		const icon = this.getAttribute('icon') || this.getAttribute('name');
		const color = this.getAttribute('color') || this.getAttribute('sx:color');
		const size = this.getAttribute('size') || 'medium';

		// Only replace content if this is a standalone icon (not inside a button)
		const isInsideButton = this.closest('x-button');
		if (!isInsideButton) {
			// Create icon element with Font Awesome class
			const iconElement = document.createElement('span');

			// Handle Font Awesome icons that already have 'fa-' prefix
			const iconClass = icon.startsWith('fa-')
				? `fa ${icon}`
				: `fa fa-${this.convertToFontAwesome(icon)}`;

			// Convert size to Font Awesome size classes
			const sizeClass = this.getFontAwesomeSizeClass(size);
			iconElement.className = `${iconClass} ${sizeClass}`;

			// Set alignment for consistent display
			iconElement.style.display = 'inline-block';
			iconElement.style.verticalAlign = 'middle';

			if (color) {
				iconElement.style.color = color;
			}

			this.innerHTML = '';
			this.appendChild(iconElement);
		} else {
			// If inside a button, just hide the x-icon element
			// The button will handle the icon rendering
			this.style.display = 'none';
		}
	}

	getFontAwesomeSizeClass(size) {
		const sizeMap = {
			'2x': 'fa-2x',
			'3x': 'fa-3x',
			'4x': 'fa-4x',
			'5x': 'fa-5x',
		};
		return sizeMap[size] || '';
	}

	convertToFontAwesome(pascalCaseName) {
		if (!pascalCaseName) return 'help';

		// Convert PascalCase to Material Symbols naming convention
		// Home -> home
		// ListAlt -> list
		// MenuBook -> menu_book
		// DriveFolderUpload -> folder_upload
		// AccountTree -> settings
		const iconMap = {
			Home: 'home',
			ListAlt: 'list-alt',
			MenuBook: 'book',
			DriveFolderUpload: 'upload',
			AccountTree: 'cog',
			Save: 'save',
			Add: 'plus',
			ArrowForward: 'arrow-right',
			ArrowBack: 'arrow-left',
			Edit: 'edit',
			Delete: 'trash-o',
			Close: 'times',
			Search: 'search',
			Filter: 'filter',
			MoreVert: 'ellipsis-v',
			MoreHoriz: 'ellipsis-h',
			Info: 'info-circle',
			Warning: 'exclamation-triangle',
			Error: 'exclamation-circle',
			Success: 'check-circle',
			CheckCircle: 'check-circle',
			Loading: 'refresh',
			People: 'users',
			Person: 'user',
			LineChart: 'line-chart',
			History: 'history',
			Construction: 'wrench',
			Settings: 'cog',
			Menu: 'bars',
			Cancel: 'times',
		};

		return (
			iconMap[pascalCaseName] ||
			pascalCaseName
				.replace(/([A-Z])/g, '_$1') // Add underscore before capital letters
				.toLowerCase() // Convert to lowercase
				.replace(/^_/, '')
		); // Remove leading underscore
	}
}
