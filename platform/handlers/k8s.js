import { createHPA, updateHPA, deleteHPA } from "./hpa.js";
import { createService, updateService, deleteService } from "./service.js";
import {
	createPVC,
	updatePVC,
	deletePVC,
	updateStatefulSetPVC,
	deleteStatefulSetPVC,
} from "./pvc.js";
import { createTektonPipeline, deleteTektonPipeline } from "./tekton.js";
import {
	updateIngress,
	deleteIngress,
	updateCustomDomainIngress,
	deleteCustomDomainIngress,
} from "./ingress.js";
import { updateTCPProxy, deleteTCPProxy } from "./tcpproxy.js";
import {
	createDeployment,
	updateDeployment,
	deleteDeployment,
} from "./deployment.js";
import {
	createStatefulSet,
	updateStatefulSet,
	deleteStatefulSet,
} from "./statefulset.js";
import { createCronJob, updateCronJob, deleteCronJob } from "./cronjob.js";
import {
	createTemplatedK8SResources,
	deleteTemplatedK8SResources,
	hasRepoChanges,
	hasDeploymentChanges,
	hasPVCChanges,
	hasServiceChanges,
	hasHPAChanges,
	hasIngressChanges,
	hasCustomDomainChanges,
	hasCustomDomainNameChanges,
	hasTCPProxyChanges,
	hasStatefulSetChanges,
	hasCronJobChanges,
} from "./util.js";

/**
 * Manages the container based on the payload.
 *
 * @param {object} payload - The payload containing information about the container.
 * @param {object} payload.container - The container object.
 * @param {string} payload.container.type - The type of the container (e.g., "deployment", "statefulset", "cronjob").
 * @param {string} payload.container.name - The name of the container.
 * @param {string} payload.action - The action to perform on the container.
 * @throws {Error} If an error occurs while managing the container.
 */
export async function manageContainer(payload) {
	try {
		if (payload.container.type === "deployment") {
			await manageDeployment(payload);
		} else if (payload.container.type === "statefulset") {
			await manageStatefulSet(payload);
		} else if (payload.container.type === "cronjob") {
			await manageCronJob(payload);
		}
	} catch (err) {
		console.log(err);
		throw new Error(
			`Cannot ${payload.action} the ${payload.container.type} named '${
				payload.container.name
			}'. ${err.response?.body?.message ?? err.message}`
		);
	}
}

/**
 * Manages the deployment of a container in a Kubernetes cluster.
 *
 * @param {Object} options - The options for managing the deployment.
 * @param {Object} options.container - The container configuration.
 * @param {Object} options.environment - The environment configuration.
 * @param {Object} options.gitProvider - The Git provider configuration.
 * @param {Object} options.registry - The container registry configuration.
 * @param {Object} options.changes - The changes made to the container configuration.
 * @param {string} options.action - The action to perform (create, update, delete).
 * @returns {Promise<void>} - A promise that resolves when the deployment is managed successfully.
 * @throws {Error} - If an error occurs during the deployment management process.
 */
async function manageDeployment({
	container,
	environment,
	gitProvider,
	registry,
	changes,
	action,
	session,
}) {
	const name = container.iid;
	const namespace = environment.iid;
	if (action === "create") {
		try {
			await createTektonPipeline(container, environment, gitProvider, session);
		} catch (err) {
			console.error(
				`Cannot create the build pipeline for deployment '${name}' in namespace ${namespace}. ${
					err.response?.body?.message ?? err.message
				}`
			);
			await deleteTektonPipeline(container, gitProvider, session);
			throw err;
		}
		await createPVC(container.storageConfig, name, namespace);
		await createService(container.networking, name, namespace);
		await createDeployment(container, namespace, registry);
		await createHPA(container.deploymentConfig, name, namespace);
	} else if (action === "update") {
		if (hasRepoChanges(changes)) {
			await deleteTektonPipeline(container, gitProvider, session);
			try {
				await createTektonPipeline(
					container,
					environment,
					gitProvider,
					session
				);
			} catch (err) {
				await deleteTektonPipeline(container, gitProvider, session);
				throw err;
			}
		}
		if (hasDeploymentChanges(changes))
			await updateDeployment(container, namespace, registry);
		if (hasPVCChanges(changes))
			await updatePVC(container.storageConfig, name, namespace);
		if (hasServiceChanges(changes))
			await updateService(container.networking, name, namespace);
		if (hasHPAChanges(changes))
			await updateHPA(container.deploymentConfig, name, namespace);
		if (hasIngressChanges(changes))
			await updateIngress(container.networking, name, namespace);
		if (hasCustomDomainChanges(changes))
			await updateCustomDomainIngress(
				container.networking,
				name,
				namespace,
				container.slug,
				hasCustomDomainNameChanges(changes)
			);
		if (hasTCPProxyChanges(changes))
			await updateTCPProxy(container.networking, name, namespace);
	} else if (action === "delete") {
		await deleteDeployment(name, namespace);
		await deleteHPA(name, namespace);
		await deletePVC(name, namespace);
		await deleteService(name, namespace);
		await deleteIngress(name, namespace);
		await deleteCustomDomainIngress(name, namespace);
		await deleteTCPProxy(
			container.networking.tcpProxy?.enabled
				? container.networking.tcpProxy.publicPort
				: null
		);
		await deleteTektonPipeline(container, gitProvider, session, false);
	}
}

/**
 * Manages the stateful set based on the provided parameters.
 *
 * @param {Object} options - The options for managing the stateful set.
 * @param {Object} options.container - The container information.
 * @param {Object} options.environment - The environment information.
 * @param {Object} options.gitProvider - The git provider information.
 * @param {Object} options.registry - The registry information.
 * @param {Object} options.changes - The changes information.
 * @param {string} options.action - The action to perform (create, update, delete).
 * @returns {Promise<void>} - A promise that resolves when the stateful set is managed.
 */
async function manageStatefulSet({
	container,
	environment,
	gitProvider,
	registry,
	changes,
	action,
	session,
}) {
	const name = container.iid;
	const namespace = environment.iid;
	if (action === "create") {
		// Creating containers from a template has a different flow
		if (container.template?.name) {
			await createTemplatedK8SResources(container, environment);
		} else {
			try {
				await createTektonPipeline(
					container,
					environment,
					gitProvider,
					session
				);
			} catch (err) {
				console.error(
					`Cannot create the build pipeline for statefulset '${name}' in namespace ${namespace}. ${
						err.response?.body?.message ?? err.message
					}`
				);
				await deleteTektonPipeline(container, gitProvider, session);
				throw err;
			}
			// Create both a ClusterIP and a headless service for the statefulset
			await createService(container.networking, name, namespace);
			await createService(
				container.networking,
				`${name}-headless`,
				namespace,
				true
			);
			// Statefulset creates its own PVCs, no need to make a call to createPVC
			await createStatefulSet(container, namespace, registry);
		}
	} else if (action === "update") {
		if (hasRepoChanges(changes)) {
			await deleteTektonPipeline(container, gitProvider, session);
			try {
				await createTektonPipeline(
					container,
					environment,
					gitProvider,
					session
				);
			} catch (err) {
				await deleteTektonPipeline(container, gitProvider, session);
				throw err;
			}
		}
		if (hasStatefulSetChanges(changes))
			await updateStatefulSet(container, namespace, registry);
		if (hasServiceChanges(changes)) {
			await updateService(container.networking, name, namespace);
			await updateService(container.networking, `${name}-headless`, namespace);
		}
		if (hasIngressChanges(changes))
			await updateIngress(container.networking, name, namespace);
		if (hasCustomDomainChanges(changes))
			await updateCustomDomainIngress(
				container.networking,
				name,
				namespace,
				container.slug,
				hasCustomDomainNameChanges(changes)
			);
		if (hasTCPProxyChanges(changes))
			await updateTCPProxy(container.networking, name, namespace);
		if (hasPVCChanges(changes))
			await updateStatefulSetPVC(
				container.storageConfig,
				container.statefulSetConfig,
				name,
				namespace
			);
	} else if (action === "delete") {
		if (container.template?.name) {
			await deleteTemplatedK8SResources(container, environment);
			await deleteIngress(name, namespace);
			await deleteCustomDomainIngress(name, namespace);
			await deleteTCPProxy(
				container.networking.tcpProxy?.enabled
					? container.networking.tcpProxy.publicPort
					: null
			);
			await deleteStatefulSetPVC(
				container.storageConfig,
				container.statefulSetConfig,
				name,
				namespace
			);
		} else {
			await deleteStatefulSet(name, namespace);
			await deleteService(name, namespace);
			await deleteService(`${name}-headless`, namespace);
			await deleteIngress(name, namespace);
			await deleteCustomDomainIngress(name, namespace);
			await deleteTCPProxy(
				container.networking.tcpProxy?.enabled
					? container.networking.tcpProxy.publicPort
					: null
			);
			await deleteTektonPipeline(container, gitProvider, session, false);
			await deleteStatefulSetPVC(
				container.storageConfig,
				container.statefulSetConfig,
				name,
				namespace
			);
		}
	}
}

/**
 * Manages the CronJob based on the provided action.
 *
 * @param {Object} options - The options for managing the CronJob.
 * @param {Object} options.container - The container object.
 * @param {Object} options.environment - The environment object.
 * @param {Object} options.gitProvider - The git provider object.
 * @param {Object} options.registry - The registry object.
 * @param {Object} options.changes - The changes object.
 * @param {string} options.action - The action to perform (create, update, delete).
 * @returns {Promise<void>} - A Promise that resolves when the CronJob is managed.
 */
async function manageCronJob({
	container,
	environment,
	gitProvider,
	registry,
	changes,
	action,
	session,
}) {
	const name = container.iid;
	const namespace = environment.iid;
	if (action === "create") {
		try {
			await createTektonPipeline(container, environment, gitProvider, session);
		} catch (err) {
			console.error(
				`Cannot create the build pipeline for cronjob '${name}' in namespace ${namespace}. ${
					err.response?.body?.message ?? err.message
				}`
			);
			await deleteTektonPipeline(container, gitProvider, session);
			throw err;
		}
		await createPVC(container.storageConfig, name, namespace);
		await createCronJob(container, namespace, registry);
	} else if (action === "update") {
		if (hasRepoChanges(changes)) {
			await deleteTektonPipeline(container, gitProvider, session);
			try {
				await createTektonPipeline(
					container,
					environment,
					gitProvider,
					session
				);
			} catch (err) {
				await deleteTektonPipeline(container, gitProvider, session);
				throw err;
			}
		}
		if (hasCronJobChanges(changes))
			await updateCronJob(container, namespace, registry);
		if (hasPVCChanges(changes))
			await updatePVC(container.storageConfig, name, namespace);
	} else if (action === "delete") {
		await deleteCronJob(name, namespace);
		await deletePVC(name, namespace);
		await deleteTektonPipeline(container, gitProvider, session, false);
	}
}
