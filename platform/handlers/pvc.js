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
 * Creates a Persistent Volume Claim (PVC) based on the provided definition.
 * @param {object} definition - The definition object for the PVC.
 * @param {boolean} definition.enabled - Indicates whether the PVC is enabled or not.
 * @param {string} name - The name of the PVC.
 * @param {string} namespace - The namespace in which the PVC will be created.
 * @returns {Promise<void>} - A promise that resolves when the PVC is created successfully.
 */
export async function createPVC(definition, name, namespace) {
	if (!definition.enabled) return;

	const manifest = fs.readFileSync(`${__dirname}/manifests/pvc.yaml`, "utf8");
	const resource = yaml.load(manifest);
	const { metadata, spec } = resource;

	// Configure name, namespace and labels
	metadata.name = name;
	metadata.namespace = namespace;

	// Configure access modes
	spec.accessModes = definition.accessModes;
	// Configure volume capacity
	spec.resources.requests.storage =
		definition.sizeType === "mebibyte"
			? `${definition.size}Mi`
			: `${definition.size}Gi`;

	// Create the PVC
	await k8sCoreApi.createNamespacedPersistentVolumeClaim(namespace, resource);

	console.info(
		`PVC '${name}' in namespace '${namespace}' created successfully`
	);
}

/**
 * Updates a Persistent Volume Claim (PVC) based on the provided definition.
 * If the PVC is disabled in the definition, it will be deleted.
 * If the PVC does not exist, it will be created.
 * If the PVC already exists, it will be updated with the new configuration.
 *
 * @param {object} definition - The definition object containing the PVC configuration.
 * @param {string} name - The name of the PVC.
 * @param {string} namespace - The namespace of the PVC.
 * @returns {Promise<void>} - A Promise that resolves when the PVC is updated.
 */
export async function updatePVC(definition, name, namespace) {
	if (!definition.enabled) {
		await deletePVC(name, namespace);
		return;
	}

	const payload = await getK8SResource("PVC", name, namespace);
	if (!payload) {
		await createPVC(definition, name, namespace);
		return;
	}
	const { metadata, spec } = payload.body;

	// Configure name, namespace and labels
	metadata.name = name;
	metadata.namespace = namespace;

	// Configure access modes
	spec.accessModes = definition.accessModes;
	// Configure volume capacity
	spec.resources.requests.storage =
		definition.sizeType === "mebibyte"
			? `${definition.size}Mi`
			: `${definition.size}Gi`;

	// Update the PVC
	await k8sCoreApi.replaceNamespacedPersistentVolumeClaim(
		name,
		namespace,
		payload.body
	);
	console.info(
		`PVC '${name}' in namespace '${namespace}' updated successfully`
	);
}

/**
 * Deletes a Persistent Volume Claim (PVC) in a Kubernetes cluster.
 *
 * @param {string} name - The name of the PVC to delete.
 * @param {string} namespace - The namespace of the PVC.
 * @returns {Promise<void>} - A promise that resolves when the PVC is deleted successfully.
 */
export async function deletePVC(name, namespace) {
	if (!(await getK8SResource("PVC", name, namespace))) return;

	try {
		await k8sCoreApi.deleteNamespacedPersistentVolumeClaim(name, namespace);
		console.info(
			`PVC '${name}' in namespace ${namespace} deleted successfully`
		);
	} catch (err) {
		console.error(
			`Error deleting PVC '${name}' in namespace ${namespace}. ${
				err.response?.body?.message ?? err.message
			}`
		);
	}
}

/**
 * Updates the Persistent Volume Claims (PVCs) for a StatefulSet.
 * @param {Object} definition - The definition object.
 * @param {Object} statefulSetConfig - The StatefulSet configuration object.
 * @param {string} name - The name of the StatefulSet.
 * @param {string} namespace - The namespace of the StatefulSet.
 * @returns {Promise<void>} - A Promise that resolves when the PVCs are updated.
 */
export async function updateStatefulSetPVC(
	definition,
	statefulSetConfig,
	name,
	namespace
) {
	if (!definition.enabled) return;

	// Get the list of PVCs in the namespace
	const { body } = await k8sCoreApi.listNamespacedPersistentVolumeClaim(
		namespace
	);
	// Filter the PVCs that belong to the stateful set
	const pvcList = body.items.filter((pvc) => pvc.metadata.name.includes(name));
	// For each PVC update the storage capacity
	for (const pvc of pvcList) {
		const { metadata, spec } = pvc;
		let storageIndex = -1;
		// Get the pod index from the PVC name
		const lastPart = metadata.name.split("-").pop();
		// Use a regular expression to find the last digit in the string
		const match = lastPart.match(/\d$/);
		if (match) {
			// Convert the last digit to an integer
			storageIndex = parseInt(match[0], 10);
		}

		if (
			storageIndex > statefulSetConfig.desiredReplicas - 1 &&
			statefulSetConfig.persistentVolumeClaimRetentionPolicy.whenScaled ===
				"Delete"
		) {
			await deletePVC(metadata.name, namespace);
		} else {
			// Configure volume capacity
			spec.resources.requests.storage =
				definition.sizeType === "mebibyte"
					? `${definition.size}Mi`
					: `${definition.size}Gi`;

			try {
				// Update the PVC
				await k8sCoreApi.replaceNamespacedPersistentVolumeClaim(
					metadata.name,
					namespace,
					pvc
				);
				console.info(
					`PVC '${metadata.name}' in namespace '${namespace}' updated successfully`
				);
			} catch (err) {
				console.error(
					`PVC '${
						metadata.name
					}' in namespace '${namespace}' cannot be updated. ${
						err.response?.body?.message ?? err.message
					}`
				);
			}
		}
	}
}

/**
 * Deletes the Persistent Volume Claims (PVCs) associated with a StatefulSet.
 * @param {object} definition - The definition object.
 * @param {object} statefulSetConfig - The StatefulSet configuration object.
 * @param {string} name - The name of the StatefulSet.
 * @param {string} namespace - The namespace of the StatefulSet.
 * @returns {Promise<void>} - A Promise that resolves when the PVCs are deleted.
 */
export async function deleteStatefulSetPVC(
	definition,
	statefulSetConfig,
	name,
	namespace
) {
	/* 	if (
		!definition.enabled ||
		statefulSetConfig.persistentVolumeClaimRetentionPolicy.whenDeleted ===
			"Retain"
	)
		return; */

	// Get the list of PVCs in the namespace
	const { body } = await k8sCoreApi.listNamespacedPersistentVolumeClaim(
		namespace
	);
	// Filter the PVCs that belong to the stateful set
	const pvcList = body.items.filter((pvc) => pvc.metadata.name.includes(name));
	// Delete the PVCs
	for (const pvc of pvcList) {
		const { metadata } = pvc;
		await deletePVC(metadata.name, namespace);
	}
}
