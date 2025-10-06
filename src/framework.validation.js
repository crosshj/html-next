// Framework Validation - Form validation utilities

// Import Yup from npm
import * as yup from 'yup';

export function validateForm(formData, schema) {
	console.log('Validating form with data:', formData);
	console.log('Using schema:', schema);

	if (!schema || !formData) {
		return {};
	}

	try {
		// Convert our simple schema format to Yup schema
		const yupSchema = buildYupSchema(schema);

		// Validate the form data
		yupSchema.validateSync(formData, { abortEarly: false });

		// If validation passes, return empty errors
		return {};
	} catch (error) {
		// Convert Yup validation errors to our format
		const errors = {};
		if (error.inner) {
			error.inner.forEach((err) => {
				errors[err.path] = err.message;
			});
		} else if (error.path) {
			errors[error.path] = error.message;
		}
		return errors;
	}
}

function buildYupSchema(schema) {
	const yupSchema = {};

	for (const [fieldName, fieldSchema] of Object.entries(schema)) {
		let fieldValidator = yup.string();

		// Set type
		if (fieldSchema.type === 'number') {
			fieldValidator = yup.number();
		} else if (fieldSchema.type === 'email') {
			fieldValidator = yup.string().email();
		} else if (fieldSchema.type === 'boolean') {
			fieldValidator = yup.boolean();
		}

		// Add required validation
		if (fieldSchema.required) {
			fieldValidator = fieldValidator.required(`${fieldName} is required`);
		}

		// Add min/max validation
		if (fieldSchema.min !== undefined) {
			if (fieldSchema.type === 'number') {
				fieldValidator = fieldValidator.min(
					fieldSchema.min,
					`${fieldName} must be at least ${fieldSchema.min}`
				);
			} else {
				fieldValidator = fieldValidator.min(
					fieldSchema.min,
					`${fieldName} must be at least ${fieldSchema.min} characters`
				);
			}
		}

		if (fieldSchema.max !== undefined) {
			if (fieldSchema.type === 'number') {
				fieldValidator = fieldValidator.max(
					fieldSchema.max,
					`${fieldName} must be at most ${fieldSchema.max}`
				);
			} else {
				fieldValidator = fieldValidator.max(
					fieldSchema.max,
					`${fieldName} must be at most ${fieldSchema.max} characters`
				);
			}
		}

		yupSchema[fieldName] = fieldValidator;
	}

	return yup.object().shape(yupSchema);
}
