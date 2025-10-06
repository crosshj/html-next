import { BaseUIComponent } from './BaseUIComponent.js';
import { SetData, getState } from '../framework.core.js';
import { validateForm } from '../framework.validation.js';

// Transform desired state HTML to current state structure
function transformFormHTML(html) {
	// Create a temporary element to parse the HTML
	const temp = document.createElement('div');
	temp.innerHTML = html;

	// Transform each input element
	const inputs = temp.querySelectorAll('input, select, textarea');

	for (const input of inputs) {
		const label = input.getAttribute('label');
		const name = input.getAttribute('name');
		const type = input.getAttribute('type') || input.tagName.toLowerCase();
		const id = input.getAttribute('id') || name;

		if (!label || !name) continue;

		// Create the form group wrapper
		const formGroup = document.createElement('div');
		formGroup.className = 'form-group';

		// Handle different input types
		if (type === 'toggle') {
			// Create toggle structure
			formGroup.innerHTML = `
				<div class="toggle-group">
					<input
						type="checkbox"
						name="${name}"
						id="${id}"
						class="toggle-input"
					/>
					<label for="${id}" class="toggle-label">
						<span class="toggle-text">${label}</span>
						<span class="toggle-switch">
							<span class="toggle-thumb"></span>
						</span>
					</label>
				</div>
			`;
		} else if (type === 'select') {
			// Create select with wrapper
			const selectHTML = input.outerHTML;
			formGroup.innerHTML = `
				<label for="${id}">${label}</label>
				<div class="select-wrap">
					${selectHTML}
				</div>
				<span class="error-message" data-field="${name}"></span>
			`;
		} else if (type === 'textarea') {
			// Create textarea with wrapper
			const textareaHTML = input.outerHTML;
			formGroup.innerHTML = `
				<label for="${id}">${label}</label>
				<div class="textarea-wrap">
					${textareaHTML}
				</div>
				<span class="error-message" data-field="${name}"></span>
			`;
		} else {
			// Create regular input
			const inputHTML = input.outerHTML;
			formGroup.innerHTML = `
				<label for="${id}">${label}</label>
				${inputHTML}
				<span class="error-message" data-field="${name}"></span>
			`;
		}

		// Replace the original input with the form group
		input.parentNode.replaceChild(formGroup, input);
	}

	// Handle buttons - wrap in form-actions
	const buttons = temp.querySelectorAll('x-button');
	if (buttons.length > 0) {
		const formActions = document.createElement('div');
		formActions.className = 'form-actions';

		for (const button of buttons) {
			formActions.appendChild(button);
		}

		temp.appendChild(formActions);
	}

	return temp.innerHTML;
}

// Define x-form web component
export class XForm extends BaseUIComponent {
	constructor() {
		super();
		this.currentFormData = {};
		this.dirty = false;
		this.submitted = false;
		this.schema = null;
		this.isValid = true;
		this.errors = {};
	}

	connectedCallback() {
		super.connectedCallback();
		// Set up the data path and form name
		this.dataPath = this.getAttribute('data');
		this.formName = this.getAttribute('name') || 'defaultForm';

		// Trigger initial state change to render form
		this.onStateChange(this.getCurrentState());
	}

	onStateChange(newState) {
		// Store current form data for use in event listeners
		const formDataPath = this.dataPath.replace('global_', '');
		this.currentFormData = newState[formDataPath] || {};

		// Get schema and validate if form is dirty
		const schemaName = this.getAttribute('schema');

		if (schemaName) {
			this.schema = newState.schemas?.[schemaName];
		}

		if (this.schema && this.dirty) {
			this.errors = validateForm(this.currentFormData, this.schema);
			this.isValid = Object.keys(this.errors).length === 0;
		} else if (!this.dirty) {
			// Clear errors if form hasn't been touched yet
			this.errors = {};
			this.isValid = true;
		}

		// Store form data directly in global state
		SetData(`forms.${this.formName}`, this.currentFormData);

		// If content attribute exists and DOM doesn't exist, create it
		if (this.getAttribute('content') && !this.querySelector('input')) {
			this.renderForm(newState);
		}

		// Always update form inputs with current state
		this.updateFormInputs(newState);

		// Update button states based on dirty and validation state
		this.updateButtonStates();
	}

	renderForm(newState) {
		let content = this.getAttribute('content');

		// Decode escaped characters
		content = content
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'")
			.replace(/&#10;/g, '\n')
			.replace(/&#13;/g, '\r')
			.replace(/&#9;/g, '\t');

		if (!content.trim()) {
			this.innerHTML = '';
			return;
		}

		// Transform the desired state HTML to current state structure
		const transformedHTML = transformFormHTML(content);
		this.innerHTML = transformedHTML;

		// Set up form bindings
		const inputs = this.querySelectorAll('input, select, textarea');

		for (const input of inputs) {
			const name = input.getAttribute('name');
			if (!name) continue;

			// Use appropriate event for each input type
			const eventType =
				input.type === 'checkbox' || input.type === 'radio'
					? 'change'
					: 'input';

			input.addEventListener(eventType, (e) => {
				const value = input.type === 'checkbox' ? input.checked : input.value;

				// Mark form as dirty and field as touched
				this.dirty = true;
				input.setAttribute('data-touched', 'true');

				// Update the specific field
				const updatedFormData = {
					...this.currentFormData,
					[name]: value,
				};

				// Update our local copy immediately
				this.currentFormData = updatedFormData;

				// Validate immediately if schema exists
				if (this.schema) {
					this.errors = validateForm(updatedFormData, this.schema);
					this.isValid = Object.keys(this.errors).length === 0;
					this.updateFormInputs(this.getCurrentState());
					this.updateButtonStates();
				}

				// Set the entire form data object
				const formDataPath = this.dataPath.replace('global_', '');
				SetData(formDataPath, updatedFormData);
			});
		}

		this.removeAttribute('content');
	}

	updateFormInputs(newState) {
		const inputs = this.querySelectorAll('input, select, textarea');

		for (const input of inputs) {
			const name = input.getAttribute('name');
			if (!name) continue;

			const stateValue = newState[this.dataPath.replace('global_', '')]?.[name];
			if (stateValue !== undefined) {
				if (input.type === 'checkbox') {
					input.checked = stateValue;
				} else {
					input.value = stateValue;
				}
			}

			// Handle error state (only for inputs that can be validated)
			// Skip checkboxes/toggles since they can't be invalid
			if (input.type !== 'checkbox' && input.type !== 'radio') {
				const error = this.errors[name];
				const isTouched = input.hasAttribute('data-touched');
				const shouldShowError = error && (isTouched || this.submitted);

				// Update error message element
				const errorMessage = this.querySelector(
					`.error-message[data-field="${name}"]`
				);
				if (errorMessage) {
					if (shouldShowError) {
						errorMessage.textContent = error;
						errorMessage.style.display = 'block';
					} else {
						errorMessage.textContent = '';
						errorMessage.style.display = 'none';
					}
				}

				if (shouldShowError) {
					input.classList.add('error');
					input.setAttribute('data-error', error);
				} else {
					input.classList.remove('error');
					input.removeAttribute('data-error');
				}
			}
		}
	}

	updateButtonStates() {
		const buttons = this.querySelectorAll('x-button');
		for (const button of buttons) {
			// Check if all touched fields are valid
			const allTouchedFieldsValid = this.areAllTouchedFieldsValid();

			// Disable buttons when form is not dirty or touched fields have errors
			if (!this.dirty || !allTouchedFieldsValid) {
				button.setAttribute('disabled', '');
			} else {
				button.removeAttribute('disabled');
			}
		}
	}

	areAllTouchedFieldsValid() {
		if (!this.schema || !this.dirty) {
			return true; // No validation needed if no schema or form not touched
		}

		const inputs = this.querySelectorAll('input, select, textarea');
		for (const input of inputs) {
			const name = input.getAttribute('name');
			if (!name) continue;

			// Skip checkboxes/toggles since they can't be invalid
			if (input.type === 'checkbox' || input.type === 'radio') {
				continue;
			}

			// Only check fields that have been touched
			if (input.hasAttribute('data-touched')) {
				const error = this.errors[name];
				if (error) {
					return false; // Found an error on a touched field
				}
			}
		}

		return true; // All touched fields are valid
	}

	// Method to mark form as submitted (can be called from flows)
	markAsSubmitted() {
		this.submitted = true;

		// Mark all fields as touched so all errors are visible
		const inputs = this.querySelectorAll('input, select, textarea');
		for (const input of inputs) {
			input.setAttribute('data-touched', 'true');
		}

		// Trigger validation for all fields
		if (this.schema) {
			this.errors = validateForm(this.currentFormData, this.schema);
			this.isValid = Object.keys(this.errors).length === 0;
			this.updateFormInputs(this.getCurrentState());
			this.updateButtonStates();
		}
	}
}
