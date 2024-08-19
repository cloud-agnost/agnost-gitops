import k8s from "@kubernetes/client-node";
import stream from "stream";

// Kubernetes client configuration
const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const commands = [
	{
		component: "registry",
		name: "registry-0",
		containerName: "registry",
		namespace: process.env.NAMESPACE,
		command: ["df", "-h", "/var/lib/registry"], // Registry disk usage
	},
	{
		component: "mongodb",
		name: "mongodb-0",
		containerName: "mongodb",
		namespace: process.env.NAMESPACE,
		command: ["df", "-h", "/data/db"], // Mongodb disk usage
	},
	{
		component: "redis",
		name: "redis-0",
		containerName: "redis",
		namespace: process.env.NAMESPACE,
		command: ["df", "-h", "/data"], // Redis disk usage
	},
	{
		component: "minio",
		name: "minio-0",
		containerName: "minio",
		namespace: process.env.NAMESPACE,
		command: ["df", "-h", "/data"], // Minio disk usage
	},
];

async function execCommandInPod(namespace, podName, containerName, command) {
	const exec = new k8s.Exec(kc);
	const stdout = new stream.PassThrough();
	const stderr = new stream.PassThrough();

	return new Promise((resolve, reject) => {
		let output = "";
		let errorOutput = "";

		stdout.on("data", (data) => {
			output += data.toString();
		});

		stderr.on("data", (data) => {
			errorOutput += data.toString();
		});

		exec
			.exec(
				namespace,
				podName,
				containerName,
				command,
				stdout,
				stderr,
				null, // no input stream
				false, // tty disabled,
				(result) => {
					if (result.status === 0 || result.status === "Success") {
						const parsedOutput = parseDfOutput(output);
						resolve({ podName, containerName, ...parsedOutput });
					} else {
						reject(
							new Error(
								`Command failed with status: ${status}, stderr: ${errorOutput}`
							)
						);
					}
				}
			)
			.catch((err) => {
				reject(err);
			});
	});
}

function parseDfOutput(output) {
	const lines = output.split("\n");
	const dataLine = lines[1]; // Assuming the second line has the data we need

	if (!dataLine) {
		throw new Error("Unexpected output format");
	}

	const parts = dataLine.trim().split(/\s+/);
	return {
		filesystem: parts[0],
		size: parts[1],
		used: parts[2],
		available: parts[3],
		usedPercentage: parts[4],
		mountPoint: parts[5],
	};
}

export async function getAllStorageUsageInfo() {
	try {
		const promises = commands.map((command) => {
			return execCommandInPod(
				command.namespace,
				command.name,
				command.containerName,
				command.command
			);
		});

		const results = await Promise.all(promises);
		return results;
	} catch (err) {
		throw new Error(`Failed to get storage usage info: ${err.message}`);
	}
}
