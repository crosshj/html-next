import { BaseUIComponent } from './BaseUIComponent.js';
import { getState } from '../framework.core.js';
import './XVizPie.css';

// Define x-viz-pie web component
export class XVizPie extends BaseUIComponent {
	constructor() {
		super();
	}

	connectedCallback() {
		// Call parent connectedCallback to handle sx: attribute processing and state subscriptions
		super.connectedCallback();

		const dataPath = this.getAttribute('data');
		if (!dataPath) {
			console.warn('x-viz-pie: no data attribute provided');
			return;
		}

		// Set initial data (BaseUIComponent handles subscriptions automatically)
		const actualPath = dataPath.startsWith('global_')
			? dataPath.substring(7)
			: dataPath;
		const initialData = getState(actualPath);
		this.updateChart(initialData);
	}

	onStateChange(newState) {
		// Update chart when state changes
		const dataPath = this.getAttribute('data');
		if (dataPath) {
			const actualPath = dataPath.startsWith('global_')
				? dataPath.substring(7)
				: dataPath;
			const data = getState(actualPath);
			this.updateChart(data);
		}
	}

	updateChart(data) {
		if (!data || !Array.isArray(data)) {
			this.innerHTML = '<div class="viz-error">No data available</div>';
			return;
		}

		// Calculate total value
		const totalValue = data.reduce((sum, item) => sum + (item.value || 0), 0);
		if (totalValue === 0) {
			this.innerHTML = '<div class="viz-error">No data to display</div>';
			return;
		}

		// Use explicit color from sx:color or fall back to app's primary color
		const baseColor = this.style.color || 'var(--palettePrimaryMain)';

		this.style.setProperty('--pie-base-color', baseColor);

		// Check if this is a donut variant
		const variant = this.getAttribute('variant');
		const isDonut = variant === 'donut';

		const radius = 98;
		const innerRadius = isDonut ? 60 : 0; // Hollow center for donut
		const centerX = 100;
		const centerY = 100;
		let currentAngle = 0;

		let svgContent = '';
		let legendContent = '';

		data.forEach((item, index) => {
			const percentage = (item.value / totalValue) * 100;
			const angle = (item.value / totalValue) * 360;
			const endAngle = currentAngle + angle;

			// Calculate arc path
			const startX =
				centerX + radius * Math.cos(((currentAngle - 90) * Math.PI) / 180);
			const startY =
				centerY + radius * Math.sin(((currentAngle - 90) * Math.PI) / 180);
			const endX =
				centerX + radius * Math.cos(((endAngle - 90) * Math.PI) / 180);
			const endY =
				centerY + radius * Math.sin(((endAngle - 90) * Math.PI) / 180);

			const largeArcFlag = angle > 180 ? 1 : 0;

			let pathData;
			if (isDonut) {
				// Create donut arc path with inner and outer radius
				const startInnerX =
					centerX +
					innerRadius * Math.cos(((currentAngle - 90) * Math.PI) / 180);
				const startInnerY =
					centerY +
					innerRadius * Math.sin(((currentAngle - 90) * Math.PI) / 180);
				const endInnerX =
					centerX + innerRadius * Math.cos(((endAngle - 90) * Math.PI) / 180);
				const endInnerY =
					centerY + innerRadius * Math.sin(((endAngle - 90) * Math.PI) / 180);

				pathData = [
					`M ${startX} ${startY}`,
					`A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
					`L ${endInnerX} ${endInnerY}`,
					`A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startInnerX} ${startInnerY}`,
					'Z',
				].join(' ');
			} else {
				// Original pie slice path
				pathData = [
					`M ${centerX} ${centerY}`,
					`L ${startX} ${startY}`,
					`A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
					'Z',
				].join(' ');
			}

			svgContent += `
				<path 
					d="${pathData}" 
					class="viz-slice"
					data-index="${index}"
				/>
			`;

			// Add legend
			legendContent += `
				<div class="viz-legend-item">
					<span class="viz-legend-color" data-index="${index}"></span>
					<span class="viz-legend-label">${item.label || ''}</span>
					<span class="viz-legend-value">${percentage.toFixed(1)}%</span>
				</div>
			`;

			currentAngle = endAngle;
		});

		this.innerHTML = `
			<div class="viz-pie-container">
				<svg viewBox="0 0 200 200" class="viz-svg">
					${svgContent}
				</svg>
				<div class="viz-legend">
					${legendContent}
				</div>
			</div>
		`;
	}
}
