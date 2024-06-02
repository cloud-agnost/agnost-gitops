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

// Payload includes container info, environment info and action
export async function manageContainer(payload) {
	try {
		if (payload.container.type === "deployment") {
			await manageDeployment(payload);
		} else if (payload.container.type === "stateful set") {
			await manageStatefulSet(payload);
		} else if (payload.container.type === "cron job") {
			await manageCronJob(payload);
		}
	} catch (err) {
		throw new AgnostError(
			t(
				`Cannot ${payload.action} the ${payload.container.type} named '${
					payload.container.name
				}''. ${err.response?.body?.message ?? err.message}`
			)
		);
	}
}

async function manageDeployment({
	container,
	environment,
	gitProvider,
	changes,
	action,
}) {
	const name = container.iid;
	const namespace = environment.iid;
	if (action === "create") {
		try {
			await createTektonPipeline(container, environment, gitProvider);
		} catch (err) {
			await deleteTektonPipeline(container, environment, gitProvider);
			throw err;
		}
		await createPVC(container.storageConfig, name, namespace);
		await createService(container.networking, name, namespace);
		await createDeployment(container, namespace);
		await createHPA(container.deploymentConfig, name, namespace);
	} else if (action === "update") {
		if (changes.gitRepo) {
			await deleteTektonPipeline(container, environment, gitProvider);
			try {
				await createTektonPipeline(container, environment, gitProvider);
			} catch (err) {
				await deleteTektonPipeline(container, environment, gitProvider);
				throw err;
			}
		}
		await updateDeployment(container, namespace);
		await updatePVC(container.storageConfig, name, namespace);
		await updateService(container.networking, name, namespace);
		await updateHPA(container.deploymentConfig, name, namespace);
		await updateIngress(
			container.networking,
			changes.containerPort,
			name,
			namespace
		);
		await updateCustomDomainIngress(
			container.networking,
			changes.containerPort,
			changes.customDomain,
			name,
			namespace
		);
		await updateTCPProxy(
			container.networking,
			changes.containerPort,
			name,
			namespace
		);
	} else if (action === "delete") {
		await deleteDeployment(name, namespace);
		await deleteHPA(name, namespace);
		await deletePVC(name, namespace);
		await deleteService(name, namespace);
		await deleteIngress(`${name}-cluster`, namespace);
		await deleteCustomDomainIngress(`${name}-domain`, namespace);
		await deleteTCPProxy(
			container.networking.tcpProxy.enabled
				? container.networking.tcpProxy.publicPort
				: null
		);
		await deleteTektonPipeline(container, environment, gitProvider);
	}
}

async function manageStatefulSet({
	container,
	environment,
	gitProvider,
	changes,
	action,
}) {
	const name = container.iid;
	const namespace = environment.iid;
	if (action === "create") {
		try {
			await createTektonPipeline(container, environment, gitProvider);
		} catch (err) {
			await deleteTektonPipeline(container, environment, gitProvider);
			throw err;
		}
		await createService(container.networking, name, namespace, true);
		// Statefulset creates its own PVCs, no need to make a call to createPVC
		await createStatefulSet(container, namespace);
	} else if (action === "update") {
		if (changes.gitRepo) {
			await deleteTektonPipeline(container, environment, gitProvider);
			try {
				await createTektonPipeline(container, environment, gitProvider);
			} catch (err) {
				await deleteTektonPipeline(container, environment, gitProvider);
				throw err;
			}
		}
		await updateStatefulSet(container, namespace);
		await updateService(container.networking, name, namespace);
		await updateIngress(
			container.networking,
			changes.containerPort,
			name,
			namespace
		);
		await updateCustomDomainIngress(
			container.networking,
			changes.containerPort,
			changes.customDomain,
			name,
			namespace
		);
		await updateTCPProxy(
			container.networking,
			changes.containerPort,
			name,
			namespace
		);
		await sleep(2000);
		await updateStatefulSetPVC(
			container.storageConfig,
			container.statefulSetConfig,
			name,
			namespace
		);
	} else if (action === "delete") {
		await deleteStatefulSet(name, namespace);
		await deleteService(name, namespace);
		await deleteIngress(`${name}-cluster`, namespace);
		await deleteCustomDomainIngress(`${name}-domain`, namespace);
		await deleteTCPProxy(
			container.networking.tcpProxy.enabled
				? container.networking.tcpProxy.publicPort
				: null
		);
		await deleteTektonPipeline(container, environment, gitProvider);
		await deleteStatefulSetPVC(
			container.storageConfig,
			container.statefulSetConfig,
			name,
			namespace
		);
	}
}

async function manageCronJob({
	container,
	environment,
	gitProvider,
	changes,
	action,
}) {
	const name = container.iid;
	const namespace = environment.iid;
	if (action === "create") {
		try {
			await createTektonPipeline(container, environment, gitProvider);
		} catch (err) {
			await deleteTektonPipeline(container, environment, gitProvider);
			throw err;
		}
		await createPVC(container.storageConfig, name, namespace);
		await createCronJob(container, namespace);
	} else if (action === "update") {
		if (changes.gitRepo) {
			await deleteTektonPipeline(container, environment, gitProvider);
			try {
				await createTektonPipeline(container, environment, gitProvider);
			} catch (err) {
				await deleteTektonPipeline(container, environment, gitProvider);
				throw err;
			}
		}
		await updateCronJob(container, namespace);
		await updatePVC(container.storageConfig, name, namespace);
	} else if (action === "delete") {
		await deleteCronJob(name, namespace);
		await deletePVC(name, namespace);
		await deleteTektonPipeline(container, environment, gitProvider);
	}
}
