import { BaseUIComponent } from './BaseUIComponent.js';
import { getState } from '../framework.core.js';
import './XVizBar.css';

// Define x-viz-bar web component
export class XVizBar extends BaseUIComponent {
	constructor() {
		super();
	}

	connectedCallback() {
		// Call parent connectedCallback to handle sx: attribute processing and state subscriptions
		super.connectedCallback();

		const dataPath = this.getAttribute('data');
		if (!dataPath) {
			console.warn('x-viz-bar: no data attribute provided');
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

		// Use explicit color from sx:color or fall back to app's primary color
		const baseColor = this.style.color || 'var(--palettePrimaryMain)';

		this.style.setProperty('--bar-base-color', baseColor);

		// Find max value for scaling
		const maxValue = Math.max(...data.map((item) => item.value || 0));

		// Create HTML bars
		let barsHTML = '';
		data.forEach((item, index) => {
			const barHeight = (item.value / maxValue) * 100; // Percentage height
			const isEven = index % 2 === 0;

			barsHTML += `
				<div class="viz-bar-container">
					<div 
						class="viz-bar ${isEven ? 'viz-bar-even' : 'viz-bar-odd'}" 
						style="height: ${barHeight}%;"
					>
						<div class="viz-value">
							<x-typography variant="caption">${item.value}</x-typography>
						</div>
					</div>
					<div class="viz-label">
						<x-typography variant="caption">${item.label || ''}</x-typography>
					</div>
				</div>
			`;
		});

		this.innerHTML = `
			<div class="viz-wrapper">
				<div class="viz-chart">
					${barsHTML}
				</div>
			</div>
		`;
	}
}
