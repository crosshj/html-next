/*
this component was written to work outside of html-next initially,

it now needs to be adapated to match the normal components in root and integrated with the system

also, it would be nice if components could be more easily reused across different contexts

also, there is probably tons of room to optimize and clean up the code
*/

import { Trigger } from '@crosshj/html-next';

class XStepper extends HTMLElement {
	constructor() {
		super();
		this.currentStep = 1;
		this.totalSteps = 3;
		this.validate = true;
		this.dataPath = null;
		this.stepData = {};

		this.init();
	}

	static get observedAttributes() {
		return [
			'steps',
			'current',
			'data',
			'validate',
			'on-step-change',
			'on-step-complete',
			'on-wizard-complete',
			'on-validation-error',
			'back-text',
			'next-text',
			'complete-text',
		];
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) return;

		switch (name) {
			case 'steps':
				// If steps attribute is provided, use it; otherwise auto-detect
				this.totalSteps = newValue ? parseInt(newValue) : this.countTemplates();
				break;
			case 'current':
				this.currentStep = parseInt(newValue) || 1;
				break;
			case 'data':
				this.dataPath = newValue;
				break;
			case 'validate':
				this.validate = newValue !== 'false';
				break;
			case 'on-step-change':
				this.stepChangeFlow = newValue;
				break;
			case 'on-step-complete':
				this.stepCompleteFlow = newValue;
				break;
			case 'on-wizard-complete':
				this.wizardCompleteFlow = newValue;
				break;
			case 'on-validation-error':
				this.validationErrorFlow = newValue;
				break;
			case 'back-text':
				this.backButtonText = newValue;
				break;
			case 'next-text':
				this.nextButtonText = newValue;
				break;
			case 'complete-text':
				this.completeButtonText = newValue;
				break;
		}

		// Update navigation if button text attributes changed
		if (['back-text', 'next-text', 'complete-text'].includes(name)) {
			this.updateNavigation();
		} else {
			this.render();
		}
	}

	connectedCallback() {
		this.render();
		this.setupEventListeners();

		// Trigger step-change event for initial load (step 0 to step 1)
		this.triggerStepChangeEvent(0, this.currentStep);
	}

	init() {
		// Parse initial attributes
		this.dataPath = this.getAttribute('data');
		this.validate = this.getAttribute('validate') !== 'false';
		this.stepChangeFlow = this.getAttribute('on-step-change');
		this.stepCompleteFlow = this.getAttribute('on-step-complete');
		this.wizardCompleteFlow = this.getAttribute('on-wizard-complete');
		this.validationErrorFlow = this.getAttribute('on-validation-error');

		// Button text attributes
		this.backButtonText = this.getAttribute('back-text');
		this.nextButtonText = this.getAttribute('next-text');
		this.completeButtonText = this.getAttribute('complete-text');

		// Auto-detect number of steps from templates
		this.totalSteps = this.countTemplates();
		this.currentStep = parseInt(this.getAttribute('current')) || 1;
	}

	countTemplates() {
		// Count templates with slot="step-X" pattern
		const templates = this.querySelectorAll('template[slot^="step-"]');
		const stepNumbers = Array.from(templates)
			.map((template) => {
				const slot = template.getAttribute('slot');
				const match = slot?.match(/^step-(\d+)$/);
				return match ? parseInt(match[1]) : 0;
			})
			.filter((num) => num > 0);

		// Return the highest step number found
		return stepNumbers.length > 0 ? Math.max(...stepNumbers) : 3;
	}

	render() {
		// Only add the stepper UI if it doesn't already exist
		if (!this.querySelector('.stepper-container')) {
			const stepperHTML = `
        <style>
          .stepper-container {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }
          
          .progress-indicator {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1rem;
          }
          
          .step {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            position: relative;
            flex: 1;
          }
          
          .step {
            --active-color: var(--palettePrimaryMain);
            --completed-color: color-mix(in srgb, var(--paletteSecondaryLight) 50%, var(--paletteBackgroundDefault));
          }


          .step-number {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 2px solid var(--paletteDivider, #e0e0e0);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 500;
            background: var(--paletteBackgroundDefault, #ffffff);
            color: var(--paletteTextSecondary, #666);
            transition: all 0.3s ease;
            z-index: 2;
          }
          
          .step.active .step-number {
            border-color: var(--active-color);
            background: var(--active-color);
            color: var(--palettePrimaryContrastText, #ffffff);
          }
          
          .step.completed .step-number {
            border-color: var(--completed-color);
            background: var(--completed-color);
            color: var(--palettePrimaryContrastText, #ffffff);
          }
          
          .step-label {
            font-size: 0.875rem;
            color: var(--paletteTextSecondary, #666);
            text-align: center;
            max-width: 100px;
          }
          
          .step.active .step-label {
            color: var(--palettePrimaryMain, #1976d2);
            font-weight: 500;
          }
          
         .step.completed .step-label {
            color: var(--completed-color);
            font-weight: 600;
         }
          .step.clickable:hover .step-number {
            transform: scale(1.1);
            background: var(--active-color);
            border-color: var(--active-color);
            transition: transform 0.2s ease;
          }
          
          .step.clickable:hover .step-label {
            color: var(--palettePrimaryMain, #1976d2);
          }
          
          .step-connector {
            position: absolute;
            top: 20px;
            left: 50%;
            width: 100%;
            height: 2px;
            background: var(--paletteDivider, #e0e0e0);
            z-index: 1;
            transition: background-color 0.3s ease;
          }
          
          .step-connector.completed {
            background: var(--completed-color);
          }
          
          .step:last-child .step-connector {
            display: none;
          }
          
        //   .step.completed + .step .step-connector {
        //     background: var(--paletteSuccessMain, #2e7d32);
        //   }
          
          .step-content {
            min-height: 300px;
            padding: 1rem;
          }
          
          .navigation {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 0;
            border-top: 1px solid var(--paletteDivider, #e0e0e0);
          }
          
          .nav-button {
            padding: 0.75rem 1.5rem;
            border: 1px solid var(--paletteDivider, #e0e0e0);
            border-radius: var(--radius-md, 0.5rem);
            cursor: pointer;
            font-size: 0.875rem;
            transition: all 0.2s ease;
			background: transparent;
          }
          
          .nav-button:hover:not(:disabled) {
            background: var(--palettePrimaryLight, #f5f5f5);
			color: var(--paletteBackgroundDefault, #000);
          }
          
          .nav-button.primary {
            background: var(--palettePrimaryMain, #1976d2);
            color: white;
            border-color: var(--palettePrimaryMain, #1976d2);
          }
          
          .nav-button.primary:hover:not(:disabled) {
            background: var(--palettePrimaryDark, #1565c0);
          }
          
          .nav-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          
          .step-indicator {
            font-size: 0.875rem;
            color: var(--paletteTextSecondary, #666);
          }
        </style>
        
        <div class="stepper-container">
          <div class="progress-indicator">
            ${this.renderProgressSteps()}
          </div>
          
          <div class="step-content" id="stepContent">
            <!-- Step content will be populated here -->
          </div>
          
          <div class="navigation">
            <button class="nav-button" id="backBtn" ${
							this.currentStep === 1 ? 'disabled' : ''
						}>
              Back
            </button>
            
            <div class="step-indicator">
              Step ${this.currentStep} of ${this.totalSteps}
            </div>
            
            <button class="nav-button primary" id="nextBtn">
              ${this.currentStep === this.totalSteps ? 'Complete' : 'Next'}
            </button>
          </div>
        </div>
      `;

			this.insertAdjacentHTML('beforeend', stepperHTML);
		}

		// After rendering, populate the step content
		this.populateStepContent();
	}

	renderProgressSteps() {
		let html = '';
		for (let i = 1; i <= this.totalSteps; i++) {
			const isActive = i === this.currentStep;
			const isCompleted = i < this.currentStep;
			const isClickable = i <= this.currentStep; // Allow clicking on current and previous steps
			const classes = ['step'];
			if (isActive) classes.push('active');
			if (isCompleted) classes.push('completed');
			if (isClickable) classes.push('clickable');

			// Get step label from template
			const stepLabel = this.getStepLabel(i);

			// Determine connector color - should be colored if the NEXT step is completed or current
			// Connector after step N should be colored if step N+1 is completed or current
			const nextStepCompleted = i < this.currentStep;
			const connectorClass = nextStepCompleted
				? 'step-connector completed'
				: 'step-connector';

			html += `
        <div class="${classes.join(' ')}" data-step="${i}" style="cursor: ${
				isClickable ? 'pointer' : 'default'
			}">
          <div class="step-number">${i}</div>
          <div class="step-label">${stepLabel}</div>
          ${i < this.totalSteps ? `<div class="${connectorClass}"></div>` : ''}
        </div>
      `;
		}
		return html;
	}

	getStepLabel(stepNumber) {
		// Look for template with this step number
		const template = this.querySelector(`template[slot="step-${stepNumber}"]`);
		if (!template) return `Step ${stepNumber}`;

		// Try to get label from template attributes
		const label =
			template.getAttribute('data-label') ||
			template.getAttribute('label') ||
			template.getAttribute('title');

		if (label) return label;

		// Try to extract label from heading elements in the template
		const heading = template.querySelector(
			'h1, h2, h3, h4, h5, h6, .step-title'
		);
		if (heading) {
			return heading.textContent.trim();
		}

		// Try to extract from x-typography with variant="h4" or similar
		const typography = template.querySelector('x-typography[variant*="h"]');
		if (typography) {
			return typography.textContent.trim();
		}

		// Fallback to generic step label
		return `Step ${stepNumber}`;
	}

	updateProgressIndicator() {
		const progressIndicator = this.querySelector('.progress-indicator');
		if (progressIndicator) {
			progressIndicator.innerHTML = this.renderProgressSteps();

			// Add click listeners to clickable steps
			const clickableSteps =
				progressIndicator.querySelectorAll('.step.clickable');
			clickableSteps.forEach((step) => {
				step.addEventListener('click', () => {
					const stepNumber = parseInt(step.getAttribute('data-step'));
					if (stepNumber !== this.currentStep) {
						this.goToStep(stepNumber);
					}
				});
			});
		}
	}

	updateNavigation() {
		const backBtn = this.querySelector('#backBtn');
		const nextBtn = this.querySelector('#nextBtn');
		const stepIndicator = this.querySelector('.step-indicator');

		if (backBtn) {
			backBtn.disabled = this.currentStep === 1;
			// Use custom back button text if provided
			if (this.backButtonText) {
				backBtn.textContent = this.backButtonText;
			}
		}

		if (nextBtn) {
			if (this.currentStep === this.totalSteps) {
				// Use custom complete button text if provided, otherwise default
				nextBtn.textContent = this.completeButtonText || 'Complete';
			} else {
				// Use custom next button text if provided, otherwise default
				nextBtn.textContent = this.nextButtonText || 'Next';
			}
		}

		if (stepIndicator) {
			stepIndicator.textContent = `Step ${this.currentStep} of ${this.totalSteps}`;
		}
	}

	// Method to change button text programmatically
	setButtonText(buttonType, text) {
		const buttonId = buttonType === 'back' ? '#backBtn' : '#nextBtn';
		const button = this.querySelector(buttonId);
		if (button) {
			button.textContent = text;
		}
	}

	// Method to change both buttons at once
	setNavigationTexts(backText, nextText) {
		this.setButtonText('back', backText);
		this.setButtonText('next', nextText);
	}

	populateStepContent() {
		// Find the step content container
		const stepContent = this.querySelector('.step-content');
		if (!stepContent) {
			return;
		}

		// Find the template for the current step - templates are now preserved as children
		const template = this.querySelector(
			`template[slot="step-${this.currentStep}"]`
		);

		if (template) {
			// Get the innerHTML of the template and insert it
			const templateHTML = template.innerHTML;
			stepContent.innerHTML = templateHTML;
		} else {
			// Show error if no template found
			stepContent.innerHTML = `
				   <div style="background: #f0f0f0; padding: 20px; text-align: center;">
					   <h3>Step ${this.currentStep} Content</h3>
					   <p>No template found for step-${this.currentStep}</p>
					   <p>Available templates: ${this.querySelectorAll('template').length}</p>
				   </div>
			   `;
		}
	}

	async callFlow(flowKey, eventData = {}) {
		// Check if flow key is provided and Trigger function is available
		if (flowKey && typeof Trigger === 'function') {
			try {
				// Pass triggeredBy and element in options to override the default
				const options = {
					triggeredBy: 'stepper',
					element: this,
				};

				await Trigger(flowKey, eventData, options);
			} catch (error) {
				console.error(`Error calling flow ${flowKey}:`, error);
			}
		} else {
		}
	}

	async triggerStepChangeEvent(fromStep, toStep) {
		const stepChangeData = {
			from: fromStep,
			to: toStep,
			data: this.stepData,
		};

		// Emit step-change event
		this.emit('step-change', stepChangeData);

		// Call step-change flow if specified
		await this.callFlow(this.stepChangeFlow, stepChangeData);
	}

	setupEventListeners() {
		const backBtn = this.querySelector('#backBtn');
		const nextBtn = this.querySelector('#nextBtn');

		backBtn?.addEventListener('click', () => this.goBack());
		nextBtn?.addEventListener('click', () => this.goNext());
	}

	async goNext() {
		if (this.validate && !(await this.validateCurrentStep())) {
			const validationErrorData = {
				step: this.currentStep,
				errors: 'Please complete all required fields',
			};
			this.emit('validation-error', validationErrorData);

			// Call validation-error flow if specified
			await this.callFlow(this.validationErrorFlow, validationErrorData);
			return;
		}

		const fromStep = this.currentStep;

		const stepData = await this.collectStepData();

		this.stepData[`step${fromStep}`] = stepData;

		const stepCompleteData = {
			step: fromStep,
			data: stepData,
		};
		this.emit('step-complete', stepCompleteData);

		// Call step-complete flow if specified
		await this.callFlow(this.stepCompleteFlow, stepCompleteData);

		if (this.currentStep < this.totalSteps) {
			this.currentStep++;
			this.updateAttributes();

			// Update progress indicator
			this.updateProgressIndicator();
			// Update navigation buttons
			this.updateNavigation();
			// Populate step content
			this.populateStepContent();

			// Trigger step-change event
			await this.triggerStepChangeEvent(fromStep, this.currentStep);
		} else {
			const wizardCompleteData = {
				data: this.stepData,
			};
			this.emit('wizard-complete', wizardCompleteData);

			// Call wizard-complete flow if specified
			await this.callFlow(this.wizardCompleteFlow, wizardCompleteData);
		}
	}

	async goBack() {
		if (this.currentStep > 1) {
			const fromStep = this.currentStep;
			this.currentStep--;
			this.updateAttributes();

			// Update progress indicator
			this.updateProgressIndicator();
			// Update navigation buttons
			this.updateNavigation();
			// Populate step content
			this.populateStepContent();
			// Trigger step-change event
			await this.triggerStepChangeEvent(fromStep, this.currentStep);
		}
	}

	async validateCurrentStep() {
		const currentSlot = this.querySelector(
			`template[slot="step-${this.currentStep}"]`
		);

		if (!currentSlot) {
			return true;
		}

		const form = currentSlot.querySelector('x-form');
		if (!form) {
			return true;
		}

		// Check if form has validation methods
		if (typeof form.markAsSubmitted === 'function') {
			form.markAsSubmitted();
		}

		// Check if form has isValid property
		if (typeof form.isValid !== 'undefined') {
			return form.isValid;
		}

		// If no validation available, assume valid
		return true;
	}

	async collectStepData() {
		const currentSlot = this.querySelector(
			`template[slot="step-${this.currentStep}"]`
		);

		if (!currentSlot) return {};

		const form = currentSlot.querySelector('x-form');
		if (!form) return {};

		return form.data || {};
	}

	updateAttributes() {
		this.setAttribute('current', this.currentStep);
	}

	emit(eventName, detail) {
		this.dispatchEvent(
			new CustomEvent(eventName, {
				detail,
				bubbles: true,
				composed: true,
			})
		);
	}

	// Public API methods
	next() {
		this.goNext();
	}

	back() {
		this.goBack();
	}

	goToStep(step) {
		if (step >= 1 && step <= this.totalSteps) {
			const fromStep = this.currentStep;
			this.currentStep = step;
			this.updateAttributes();

			// Update progress indicator
			this.updateProgressIndicator();
			// Update navigation buttons
			this.updateNavigation();
			// Populate step content
			this.populateStepContent();
			this.emit('step-change', {
				from: fromStep,
				to: this.currentStep,
				data: this.stepData,
			});
		}
	}

	reset() {
		this.currentStep = 1;
		this.stepData = {};
		this.updateAttributes();

		// Update progress indicator
		this.updateProgressIndicator();
		// Update navigation buttons
		this.updateNavigation();
		// Populate step content
		this.populateStepContent();
	}

	getData() {
		return this.stepData;
	}

	setData(data) {
		this.stepData = data;
	}
}

export default XStepper;
