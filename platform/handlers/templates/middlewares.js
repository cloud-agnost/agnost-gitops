import registryCtrl from "../../controllers/registry.js";
import helper from "../../util/helper.js";
import { templates } from "./index.js";

import ERROR_CODES from "../../config/errorCodes.js";

/**
 * Middleware function to construct the request body for a container created from a template.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {void}
 */
export const constructCreateRequestBodyForTemplate = async (req, res, next) => {
	// If this is not a container created from a template then skip this middleware
	if (!req.template) return next();
	// Get the original request body
	const { body } = req;
	const { config } = req.template;

	const publicRegistry = await getPublicRegistry();
	if (!publicRegistry) {
		return res.status(401).json({
			error: "Not Found",
			details:
				"Cannot find the default public registry configuration of the cluster.",
			code: ERROR_CODES.notFound,
		});
	}

	// Construct the request body
	const requestBody = {
		name: body.name,
		type: body.type,
		template: {
			name: req.template.name,
			manifest: req.template.manifest,
			version: req.template.version,
		},
		variables: [],
		repoOrRegistry: "registry",
		registry: {
			registryId: publicRegistry._id,
		},
	};

	// Apply default values to the request body
	Object.entries(config.defaultValues).forEach(([key, value]) => {
		const path = key.split(".");
		// Iterage through the path and set the value on the request body
		let current = requestBody;
		for (let i = 0; i < path.length - 1; i++) {
			const field = path[i];
			if (!current[field]) {
				current[field] = {};
			}
			current = current[field];
		}
		current[path[path.length - 1]] = value;
	});

	// Iterate through secrets and variables and set them on the request
	// The secrets are configured in the template configuration such as the following: {{random:18}}
	if (config.secrets) {
		const secrets = {};
		let regex = /{{\s*[^\r\n\t\f\v{}]*\s*}}/g;
		Object.entries(config.secrets).forEach(([key, value]) => {
			secrets[key] = value;
			if (value) {
				let hasExpression = value.match(regex);
				if (hasExpression) {
					hasExpression.forEach((m) => {
						let expressions = m.match(/[^{{]+(?=}})/g);
						if (expressions.length > 0) {
							let expItems = expressions[0].trim().split(":");
							if (expItems.length > 1) {
								let func = expItems[0].trim();
								if (func === "random") {
									// Convert the second expItem to integer
									let length = parseInt(expItems[1].trim());
									secrets[key] = helper.generateSecret(length);
								}
							} else secrets[key] = expItems[0];
						} else secrets[key] = "";
					});
				}
			}
		});

		// Assign secrets to the request body
		req.secrets = secrets;
	} else {
		// Assign secrets to the request body
		req.secrets = {};
	}

	// Iterate through variables
	if (config.variables) {
		const variables = [];
		let regex = /{{\s*[^\r\n\t\f\v{}]*\s*}}/g;
		Object.entries(config.variables).forEach(([key, value]) => {
			const entry = { name: key, value: value };
			variables.push(entry);
			if (value) {
				let hasExpression = value.match(regex);
				if (hasExpression) {
					hasExpression.forEach((m) => {
						let expressions = m.match(/[^{{]+(?=}})/g);
						if (expressions.length > 0) {
							let expItems = expressions[0].trim().split(":");
							if (expItems.length > 1) {
								let func = expItems[0].trim();
								if (func === "secret") {
									const secret = req.secrets[expItems[1].trim()];
									entry.value = secret ?? "";
								}
							} else entry.value = expItems[0];
						} else {
							entry.value = "";
						}
					});
				}
			}
		});

		requestBody.variables = variables;
	} else {
		requestBody.variables = [];
	}

	// As a last step we need to set the values on the original request body on the new request object
	// Iterate through the visible fields and set them on the new request body unless they are not disabled
	for (const field of config.visibleFields) {
		if (config.disabledFields.includes(field)) continue;
		const path = field.split(".");
		let oldBody = body;
		let newBody = requestBody;
		let hasValue = true;
		for (let i = 0; i < path.length - 1; i++) {
			const field = path[i];
			// If the field is not available on the request body then continue to the next field
			if (!oldBody[field]) {
				hasValue = false;
				break;
			}

			oldBody = oldBody[field];
			newBody = newBody[field];
		}

		if (hasValue)
			newBody[path[path.length - 1]] = oldBody[path[path.length - 1]];
	}

	// Set the new request body on the request object to the new request body
	req.body = requestBody;

	next();
};

/**
 * Middleware function to construct the request body for a container created from a template.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {void}
 */
export const constructUpdateRequestBodyForTemplate = async (req, res, next) => {
	const { container } = req;
	// If this is not a container created from a template then skip this middleware
	if (!container.template?.name) return next();

	// Get the template of this container
	let template = null;
	templates.forEach((category) => {
		category.templates.forEach((t) => {
			if (
				t.name === container.template.name &&
				t.version === container.template.version
			) {
				template = t;
			}
		});
	});

	if (!template) {
		return res.status(404).json({
			error: "Not Found",
			details: "Cannot find the template of the container.",
			code: ERROR_CODES.notFound,
		});
	} else {
		// Assign template to the request object
		req.template = template;
	}

	// Get the original request body
	const { body } = req;
	const { config } = req.template;

	// Construct the request body, get a copy of the container object
	const requestBody = {
		...JSON.parse(JSON.stringify(container)),
	};

	// Set the values on the original request body on the new request object
	// Iterate through the visible fields and set them on the new request body unless they are not disabled
	for (const field of config.visibleFields) {
		if (config.disabledFields.includes(field)) continue;
		const path = field.split(".");
		let oldBody = body;
		let newBody = requestBody;
		let hasValue = true;
		for (let i = 0; i < path.length - 1; i++) {
			const field = path[i];
			// If the field is not available on the request body then continue to the next field
			if (!oldBody[field]) {
				hasValue = false;
				break;
			}

			if (!newBody[field]) {
				newBody[field] = {};
			}

			oldBody = oldBody[field];
			newBody = newBody[field];
		}

		if (hasValue)
			newBody[path[path.length - 1]] = oldBody[path[path.length - 1]];
	}

	// Set the new request body on the request object to the new request body
	req.body = requestBody;

	next();
};

/**
 * Retrieves the public registry from the database.
 * @returns {Promise<Object>} The public registry object.
 */
async function getPublicRegistry() {
	const registry = await registryCtrl.getOneByQuery({
		isClusterEntity: true,
		type: "Public",
	});

	return registry;
}
