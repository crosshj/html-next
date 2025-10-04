import { BaseUIComponent } from './BaseUIComponent.js';
import { getState, subscribeToState } from '../framework.core.js';
import { html } from '../framework.utils.js';
import './XVizLine.css';

// Define x-viz-line web component
export class XVizLine extends BaseUIComponent {
	constructor() {
		super();
		this.original = Array.from(this.attributes).reduce((obj, attr) => {
			obj[attr.name] = attr.value;
			return obj;
		}, {});
	}

	connectedCallback() {
		// Call parent connectedCallback to handle sx: attribute processing and state subscriptions
		super.connectedCallback();

		const dataPath = this.getAttribute('data');
		if (!dataPath) {
			console.warn('x-viz-line: no data attribute provided');
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
		const chartColor = this.style.color || 'var(--palettePrimaryMain)';
		this.style.setProperty('--line-base-color', chartColor);

		// Find max and min values for scaling with minimal padding
		const dataMax = Math.max(...data.map((item) => item.value || 0));
		const dataMin = Math.min(...data.map((item) => item.value || 0));
		const dataRange = dataMax - dataMin;

		// Add just 2% padding above and below for minimal spacing
		const padding_percent = 0.02;
		const maxValue = dataMax + dataRange * padding_percent;
		const minValue = dataMin - dataRange * padding_percent;

		// Create SVG path for the line
		const svgWidth = 400;
		const svgHeight = 200;
		const leftPadding = 65; // Space for y-axis labels (increased to accommodate labels positioned at leftPadding - 20)
		const rightPadding = 20; // More right padding to prevent clipping
		const topPadding = 20; // Space for hover value labels (font-size + some buffer)
		const bottomPadding = 30; // Space for x-axis labels
		const chartWidth = svgWidth - leftPadding - rightPadding;
		const chartHeight = svgHeight - topPadding - bottomPadding;

		// Create y-axis labels with better scaling
		const valueRange = maxValue - minValue;
		const roughStep = valueRange / 4; // Aim for about 4-5 intervals

		// Round step to nice numbers (1, 2, 5, 10, 20, 50, 100, etc.)
		const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
		const normalizedStep = roughStep / magnitude;
		let niceStep;
		if (normalizedStep <= 1) niceStep = 1;
		else if (normalizedStep <= 2) niceStep = 2;
		else if (normalizedStep <= 5) niceStep = 5;
		else niceStep = 10;

		const step = niceStep * magnitude;

		// Use the actual data range with minimal padding instead of extending to nice numbers
		const yAxisStart = minValue;
		const yAxisEnd = maxValue;
		const actualRange = yAxisEnd - yAxisStart;

		// Create y-axis ticks at nice intervals, but don't extend beyond our data range
		let yAxisHTML = '';
		const firstTick = Math.ceil(yAxisStart / step) * step;
		const lastTick = Math.floor(yAxisEnd / step) * step;

		for (let value = firstTick; value <= lastTick; value += step) {
			const y =
				svgHeight -
				bottomPadding -
				((value - yAxisStart) / actualRange) * chartHeight;

			yAxisHTML += `
				<text 
					x="${leftPadding - 20}" 
					y="${y + 4}" 
					class="viz-y-axis-text"
					text-anchor="end"
				>
					${Math.round(value)}
				</text>
				<line 
					x1="${leftPadding - 15}" 
					y1="${y}" 
					x2="${leftPadding - 10}" 
					y2="${y}" 
					class="viz-y-axis-tick"
				/>
			`;
		}

		// Update points calculation to use the specific padding values
		const points = data.map((item, index) => {
			const x = leftPadding + (index / (data.length - 1)) * chartWidth;
			const y =
				svgHeight -
				bottomPadding -
				((item.value - yAxisStart) / actualRange) * chartHeight;
			return { x, y, value: item.value, label: item.label };
		});

		// Check if this is a smooth variant
		const variant = this.getAttribute('variant');
		const isSmooth = variant === 'smooth';
		const hasFill = this.hasAttribute('fill');

		// Create path string
		let pathData;
		if (isSmooth) {
			// Create smooth curve using cubic bezier curves
			pathData = this.createSmoothPath(points);
		} else {
			// Create straight line segments
			pathData = points
				.map((point, index) => {
					return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
				})
				.join(' ');
		}

		// Create area fill path if needed
		let areaHTML = '';
		if (hasFill) {
			const areaPath =
				pathData +
				` L ${points[points.length - 1].x} ${svgHeight - bottomPadding}` +
				` L ${points[0].x} ${svgHeight - bottomPadding} Z`;
			areaHTML = `<path d="${areaPath}" class="viz-area" />`;
		}

		// Create circle points and labels
		let pointsHTML = '';
		let labelsHTML = '';
		points.forEach((point, index) => {
			pointsHTML += `
				<g class="viz-point-group" data-index="${index}">
					<circle 
						cx="${point.x}" 
						cy="${point.y}" 
						r="4" 
						class="viz-point"
					/>
					<text 
						x="${point.x}" 
						y="${point.y - 10}" 
						class="viz-value-text"
						text-anchor="middle"
					>
						${point.value}
					</text>
				</g>
			`;

			labelsHTML += `
				<text 
					x="${point.x}" 
					y="${svgHeight - 10}" 
					class="viz-label-text"
					text-anchor="middle"
				>
					${point.label}
				</text>
			`;
		});

		this.innerHTML = html`
			<div class="viz-line-container">
				<svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="viz-svg">
					<!-- Grid lines (optional) -->
					<defs>
						<pattern
							id="grid"
							width="40"
							height="20"
							patternUnits="userSpaceOnUse"
						>
							<path
								d="M 40 0 L 0 0 0 20"
								fill="none"
								stroke="var(--paletteDivider, #e0e0e0)"
								stroke-width="0.5"
								opacity="0.3"
							/>
						</pattern>
					</defs>
					<rect width="100%" height="100%" fill="url(#grid)" />

					<!-- Y-axis -->
					${yAxisHTML}

					<!-- Area fill (if enabled) -->
					${areaHTML}

					<!-- Line path -->
					<path
						d="${pathData}"
						class="viz-line"
						fill="none"
						stroke="var(--line-base-color)"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>

					<!-- Bottom labels -->
					${labelsHTML}

					<!-- Data points with hover values -->
					${pointsHTML}
				</svg>
			</div>
		`;
	}

	createSmoothPath(points) {
		if (points.length === 0) return '';
		if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
		if (points.length === 2)
			return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

		// Use Catmull-Rom spline for natural smooth curves
		let path = `M ${points[0].x} ${points[0].y}`;

		// For Catmull-Rom, we need to add virtual points at the beginning and end
		const extendedPoints = [
			// Virtual start point
			{
				x: points[0].x - (points[1].x - points[0].x),
				y: points[0].y - (points[1].y - points[0].y),
			},
			...points,
			// Virtual end point
			{
				x:
					points[points.length - 1].x +
					(points[points.length - 1].x - points[points.length - 2].x),
				y:
					points[points.length - 1].y +
					(points[points.length - 1].y - points[points.length - 2].y),
			},
		];

		// Generate smooth curves using Catmull-Rom spline
		for (let i = 1; i < points.length; i++) {
			const p0 = extendedPoints[i - 1];
			const p1 = extendedPoints[i];
			const p2 = extendedPoints[i + 1];
			const p3 = extendedPoints[i + 2];

			// Catmull-Rom to Bezier conversion
			// Control points for cubic bezier curve
			const cp1x = p1.x + (p2.x - p0.x) / 6;
			const cp1y = p1.y + (p2.y - p0.y) / 6;
			const cp2x = p2.x - (p3.x - p1.x) / 6;
			const cp2y = p2.y - (p3.y - p1.y) / 6;

			path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
		}

		return path;
	}
}
