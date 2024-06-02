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

// Definition is networking
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

	console.log(
		`Service '${name}' in namespace '${namespace}' created successfully`
	);
}

// Definition is networking
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

	console.log(
		`Service '${name}' in namespace '${namespace}' updated successfully`
	);
}

export async function deleteService(name, namespace) {
	if (!(await getK8SResource("Service", name, namespace))) return;

	try {
		await k8sCoreApi.deleteNamespacedService(name, namespace);
		console.log(
			`Service '${name}' in namespace ${namespace} deleted successfully`
		);
	} catch (err) {
		console.error(
			`Error deleting service '${name}' in namespace ${namespace}. ${err.response?.body?.message}`
		);
	}
}
