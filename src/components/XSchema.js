import { BaseUIComponent } from './BaseUIComponent.js';
import { SetData, getState } from '../framework.core.js';

const decodeContent = (content) =>
	content
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&#10;/g, '\n')
		.replace(/&#13;/g, '\r')
		.replace(/&#9;/g, '\t');

const parseRule = (rule, fieldSchema) => {
	// Handle special case for 'required' (no value)
	if (rule === 'required') {
		fieldSchema.required = true;
		return;
	}

	// Parse as key:value pair
	const colonIndex = rule.indexOf(':');
	if (colonIndex === -1) {
		// No colon, treat as type
		fieldSchema.type = rule;
		return;
	}

	const key = rule.substring(0, colonIndex).trim();
	const value = rule.substring(colonIndex + 1).trim();

	// Convert value to appropriate type
	let parsedValue = value;
	if (key === 'min' || key === 'max') {
		parsedValue = parseInt(value);
		if (isNaN(parsedValue)) return; // Skip invalid numbers
	}

	fieldSchema[key] = parsedValue;
};

const parseSchemaDefinition = (content) => {
	const schema = {};

	for (const line of content.split('\n')) {
		const trimmed = line.trim();
		if (!trimmed) continue;

		const colonIndex = trimmed.indexOf(':');
		if (colonIndex === -1) continue;

		const fieldName = trimmed.substring(0, colonIndex).trim();
		const rules = trimmed.substring(colonIndex + 1).trim();
		if (!fieldName || !rules) continue;

		const ruleParts = rules.split(',').map((r) => r.trim());

		const fieldSchema = { type: 'string' };
		ruleParts.forEach((rule) => parseRule(rule, fieldSchema));

		schema[fieldName] = fieldSchema;
	}

	return schema;
};

export class XSchema extends BaseUIComponent {
	connectedCallback() {
		super.connectedCallback();
		this.processSchema();
	}

	processSchema() {
		const content = this.getAttribute('content');
		const schemaName = this.getAttribute('name');

		if (!schemaName) {
			console.error('x-schema: name attribute is required');
			return;
		}

		this.removeAttribute('content');

		if (!content || !content.trim()) {
			return;
		}

		const decodedContent = decodeContent(content);
		const parsedSchema = parseSchemaDefinition(decodedContent.trim());
		SetData(`schemas.${schemaName}`, parsedSchema);
	}
}
