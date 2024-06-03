import fs from "fs";
import k8s from "@kubernetes/client-node";
import path from "path";
import yaml from "js-yaml";
import { fileURLToPath } from "url";

// Kubernetes client configuration
const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Creates a namespace for the specified environment.
 *
 * @param {object} environment - The environment object.
 * @param {string} environment.iid - The unique identifier for the environment.
 * @param {string} environment.name - The name of the environment.
 * @returns {Promise<object>} - A promise that resolves to an object with the status of the operation.
 * @throws {Error} - If there is an error creating the namespace.
 */
export async function createNamespace(environment) {
	try {
		const manifest = fs.readFileSync(
			`${__dirname}/manifests/namespace.yaml`,
			"utf8"
		);
		const resource = yaml.load(manifest);
		const { metadata } = resource;

		metadata.name = environment.iid;
		await k8sCoreApi.createNamespace(resource);

		console.info(`Namespace '${environment.iid}' created successfully`);
		return { status: "success" };
	} catch (err) {
		throw new Error(
			`Cannot create the namespace of environment '${environment.name}'. ${
				err.response?.body?.message ?? err.message
			}`
		);
	}
}

/**
 * Deletes namespaces based on the provided environment IDs.
 * @param {string[]} environmentiids - An array of environment IDs.
 * @returns {Promise<{ status: string }>} - A promise that resolves to an object with a status property.
 */
export async function deleteNamespaces(environmentiids) {
	for (const iid of environmentiids) {
		k8sCoreApi.deleteNamespace(iid).then(
			() => {
				console.info(`Namespace '${iid}' deleted successfully`);
			},
			(err) => {
				console.error(
					`Error deleting namespace '${iid}'. ${
						err.response?.body?.message ?? err.message
					}`
				);
			}
		);
	}
}
