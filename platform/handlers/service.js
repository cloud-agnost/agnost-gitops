import fs from "fs";
import k8s from "@kubernetes/client-node";
import path from "path";
import yaml from "js-yaml";
import { fileURLToPath } from "url";
import { getK8SResource } from "./util.js";

// Kubernetes client configuration
const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Creates a service in Kubernetes.
 * @param {Object} definition - The definition of the service.
 * @param {string} name - The name of the service.
 * @param {string} namespace - The namespace in which the service will be created.
 * @param {boolean} [isHeadless=false] - Indicates whether the service is headless.
 * @returns {Promise<void>} - A promise that resolves when the service is created successfully.
 */
export async function createService(
	definition,
	name,
	namespace,
	isHeadless = false
) {
	const manifest = fs.readFileSync(
		`${__dirname}/manifests/service.yaml`,
		"utf8"
	);
	const resource = yaml.load(manifest);
	const { metadata, spec } = resource;

	if (isHeadless) {
		spec.clusterIP = "None";
		delete spec.type;
	}

	// Configure name, namespace and labels
	metadata.name = name;
	metadata.namespace = namespace;

	// Configure target app
	spec.selector.app = name;
	// Set the port
	spec.ports[0].port = definition.containerPort;
	spec.ports[0].targetPort = definition.containerPort;

	// Create the service
	await k8sCoreApi.createNamespacedService(namespace, resource);

	console.info(
		`Service '${name}' in namespace '${namespace}' created successfully`
	);
}

/**
 * Updates a Kubernetes Service with the provided definition, name, and namespace.
 * If the Service does not exist, it will be created.
 * @param {object} definition - The definition of the Service.
 * @param {string} name - The name of the Service.
 * @param {string} namespace - The namespace of the Service.
 * @returns {Promise<void>} - A Promise that resolves when the Service is updated or created.
 */
export async function updateService(definition, name, namespace) {
	const payload = await getK8SResource("Service", name, namespace);
	if (!payload) {
		await createService(definition, name, namespace);
		return;
	}
	const { metadata, spec } = payload.body;

	// Configure name, namespace and labels
	metadata.name = name;
	metadata.namespace = namespace;

	// Configure target app
	spec.selector.app = name;
	// Set the port
	spec.ports[0].port = definition.containerPort;
	spec.ports[0].targetPort = definition.containerPort;

	// Update the service
	await k8sCoreApi.replaceNamespacedService(name, namespace, payload.body);

	console.info(
		`Service '${name}' in namespace '${namespace}' updated successfully`
	);
}

/**
 * Deletes a service in the specified namespace.
 *
 * @param {string} name - The name of the service to delete.
 * @param {string} namespace - The namespace of the service.
 * @returns {Promise<void>} - A promise that resolves when the service is deleted successfully.
 */
export async function deleteService(name, namespace) {
	if (!(await getK8SResource("Service", name, namespace))) return;

	try {
		await k8sCoreApi.deleteNamespacedService(name, namespace);
		console.info(
			`Service '${name}' in namespace ${namespace} deleted successfully`
		);
	} catch (err) {
		console.error(
			`Error deleting service '${name}' in namespace ${namespace}. ${
				err.response?.body?.message ?? err.message
			}`
		);
	}
}
