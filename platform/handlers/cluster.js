import config from "config";
import k8s from "@kubernetes/client-node";
import tcpProxyPortCtrl from "../controllers/tcpProxyPort.js";
import { getKey, setKey, incrementKey } from "../init/cache.js";

// Create a Kubernetes core API client
const kubeconfig = new k8s.KubeConfig();
kubeconfig.loadFromDefault();
const k8sApi = kubeconfig.makeApiClient(k8s.NetworkingV1Api);

/**
 * Retrieves the IP addresses of the cluster's load balancer ingress.
 * @returns {Promise<Array<string>>} An array of IP addresses or hostnames.
 */
export async function getClusterIPs() {
	try {
		const result = await k8sApi.readNamespacedIngress(
			"platform",
			process.env.NAMESPACE
		);
		const ingress = result.body;
		return ingress.status.loadBalancer.ingress.map(
			(ing) => ing.ip || ing.hostname
		);
	} catch (err) {
		console.error(
			`Cannot fetch cluster ips. ${err.response?.body?.message ?? err.message}`
		);
		return [];
	}
}

/**
 * Retrieves a new TCP port number.
 * If a key-value pair for "agnost_tcp_proxy_port_number" exists, it returns the latest port number.
 * If not, it checks the database for the latest port number. If found, it sets the latest port number in cache.
 * If not found, it sets the key-value pair to the value specified in the configuration.
 * It then increments the key-value pair by 1 and saves the new port number to the database.
 * @returns {Promise<number>} The new TCP port number.
 */
export async function getNewTCPPortNumber() {
	// First check if we have key value
	const latestPortNumber = await getKey("agnost_tcp_proxy_port_number");
	// Ok we do not have it set it to the latest value
	if (!latestPortNumber) {
		// First check if we have a database entry
		const entry = await tcpProxyPortCtrl.getOneByQuery(
			{},
			{ sort: { port: "desc" } }
		);

		if (entry) {
			// Set the latest port number to the latest value
			await setKey("agnost_tcp_proxy_port_number", entry.port);
		} else {
			// Set the latest port number to the latest value
			await setKey(
				"agnost_tcp_proxy_port_number",
				config.get("general.tcpProxyPortStart")
			);
		}
	}

	const newPortNumber = await incrementKey("agnost_tcp_proxy_port_number", 1);
	// Save new port number to database
	await tcpProxyPortCtrl.create({ port: newPortNumber });
	return newPortNumber;
}
