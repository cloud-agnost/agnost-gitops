import fs from "fs";
import crypto from "crypto";
import k8s from "@kubernetes/client-node";
import path from "path";
import { Octokit } from "@octokit/core";
import axios from "axios";
import { fileURLToPath } from "url";
import { getClusterRecord } from "./util.js";
import { initializeClusterCertificateIssuer } from "./ingress.js";
import helper from "../util/helper.js";

// Kubernetes client configuration
const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sAuthApi = kc.makeApiClient(k8s.RbacAuthorizationV1Api);
const k8sCustomObjectApi = kc.makeApiClient(k8s.CustomObjectsApi);
const k8sNetworkingApi = kc.makeApiClient(k8s.NetworkingV1Api);

const agnostNamespace = process.env.NAMESPACE;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Container is container object and environment is environment object
export async function createTektonPipeline(
	container,
	environment,
	gitProvider
) {
	// If the repo is not connected then return
	if (!container.repo.connected || !gitProvider) return;

	const { repo } = container;
	const namespace = environment.iid;
	const gitRepoType = repo.type;
	const pipelineId = container.iid;
	const gitRepoUrl = repo.url;
	const gitPat = gitProvider.accessToken;
	const gitBranch = repo.branch;
	const gitSubPath = repo.path;
	const appKind = formatKubernetesName(container.type);
	const appName = container.iid;
	const dockerfile = repo.dockerfile;
	const containerImageName = container.iid;
	const manifest = fs.readFileSync(
		`${__dirname}/manifests/${gitRepoType}-pipeline.yaml`,
		"utf8"
	);
	const resources = k8s.loadAllYaml(manifest);

	const group = "triggers.tekton.dev";
	const version = "v1beta1";

	// Get cluster info from the database
	const cluster = await getClusterRecord();

	for (const resource of resources) {
		try {
			const { kind, metadata } = resource;

			if (metadata.namespace) {
				var resource_namespace = metadata.namespace;
			}

			var resourceNameSuffix = "-" + pipelineId;
			resource.metadata.name += resourceNameSuffix;

			switch (kind) {
				case "ServiceAccount":
					await k8sCoreApi.createNamespacedServiceAccount(
						resource_namespace,
						resource
					);
					break;
				case "Secret":
					var secretToken = crypto.randomBytes(20).toString("hex");
					resource.stringData.secretToken = secretToken;
					await k8sCoreApi.createNamespacedSecret(resource_namespace, resource);
					break;
				case "ClusterRoleBinding":
					resource.subjects[0].name += resourceNameSuffix;
					await k8sAuthApi.createClusterRoleBinding(resource);
					break;
				case "RoleBinding":
					resource.subjects[0].name += resourceNameSuffix;
					await k8sAuthApi.createNamespacedRoleBinding(
						resource_namespace,
						resource
					);
					break;
				case "Ingress":
					resource.spec.rules[0].http.paths[0].path =
						"/tekton-" + pipelineId + "(/|$)(.*)";
					resource.spec.rules[0].http.paths[0].backend.service.name +=
						resourceNameSuffix;
					// If cluster has SSL settings and custom domains then also add these to the API server ingress
					if (cluster) {
						if (cluster.enforceSSLAccess) {
							resource.metadata.annotations[
								"nginx.ingress.kubernetes.io/ssl-redirect"
							] = "true";
							resource.metadata.annotations[
								"nginx.ingress.kubernetes.io/force-ssl-redirect"
							] = "true";
						} else {
							resource.metadata.annotations[
								"nginx.ingress.kubernetes.io/ssl-redirect"
							] = "false";
							resource.metadata.annotations[
								"nginx.ingress.kubernetes.io/force-ssl-redirect"
							] = "false";
						}

						if (cluster.domains.length > 0) {
							await initializeClusterCertificateIssuer();
							resource.metadata.annotations["cert-manager.io/cluster-issuer"] =
								"letsencrypt-clusterissuer";
							resource.metadata.annotations["kubernetes.io/ingress.class"] =
								"nginx";

							resource.spec.tls = cluster.domains.map((domainName) => {
								const secretName = helper.getCertSecretName();
								return {
									hosts: [domainName],
									secretName: secretName,
								};
							});

							for (const domainName of cluster.domains) {
								resource.spec.rules.unshift({
									host: domainName,
									http: {
										paths: [
											{
												path: "/tekton-" + pipelineId + "(/|$)(.*)",
												pathType: "ImplementationSpecific",
												backend: {
													service: {
														name: `el-github-listener-${pipelineId}`,
														port: { number: 8080 },
													},
												},
											},
										],
									},
								});
							}
						}
					}
					await k8sNetworkingApi.createNamespacedIngress(
						resource_namespace,
						resource
					);
					break;
				case "EventListener":
					resource.spec.triggers[0].interceptors[0].params[0].value.secretName +=
						resourceNameSuffix;
					resource.spec.triggers[0].interceptors[1].params[0].value = `body.ref == 'refs/heads/${gitBranch}'`;
					resource.spec.triggers[0].bindings[0].ref += resourceNameSuffix;
					resource.spec.triggers[0].template.ref += resourceNameSuffix;
					resource.spec.resources.kubernetesResource.spec.template.spec.serviceAccountName +=
						resourceNameSuffix;
					if (gitSubPath != "/") {
						resource.spec.triggers[0].interceptors[1].params[1].name = "filter";
						// remove leading slash, if exists
						var path = gitSubPath.replace(/^\/+/, "");
						resource.spec.triggers[0].interceptors[1].params[1].value = `body.commits.all(c, c.modified.exists(m, m.startsWith("${path}")) || c.added.exists(a, a.startsWith("${path}")) || c.removed.exists(r, r.startsWith("${path}")))`;
					} else {
						delete resource.spec.triggers[0].interceptors[1].params[1];
					}
					await k8sCustomObjectApi.createNamespacedCustomObject(
						group,
						version,
						resource_namespace,
						"eventlisteners",
						resource
					);
					break;
				case "TriggerBinding":
					resource.spec.params[0].value = appKind;
					resource.spec.params[1].value = appName;
					resource.spec.params[2].value = namespace;
					resource.spec.params[3].value =
						"local-registry." + agnostNamespace + ":5000";
					resource.spec.params[4].value = gitPat;
					resource.spec.params[5].value = gitBranch;
					resource.spec.params[6].value = gitSubPath.replace(/^\/+/, ""); // remove leading slash, if exists
					resource.spec.params[7].value = containerImageName;
					resource.spec.params[8].value = dockerfile.replace(/^\/+/, ""); // remove leading slash, if exists
					await k8sCustomObjectApi.createNamespacedCustomObject(
						group,
						version,
						resource_namespace,
						"triggerbindings",
						resource
					);
					break;
				case "TriggerTemplate":
					{
						let secretName = "regcred-local-registry";
						resource.spec.resourcetemplates[0].spec.taskSpec.volumes[0].secret.secretName =
							secretName;
						resource.spec.resourcetemplates[0].spec.serviceAccountName +=
							resourceNameSuffix;
						await k8sCustomObjectApi.createNamespacedCustomObject(
							group,
							version,
							resource_namespace,
							"triggertemplates",
							resource
						);
					}
					break;
				default:
					console.info(`!!! Skipping: ${kind}`);
			}
			console.info(`${kind} ${resource.metadata.name} created...`);
		} catch (err) {
			console.error(
				`Error applying tekton pipeline resource ${resource.kind} ${resource.metadata.name}...`,
				err.body?.message ?? err
			);
			throw err;
		}
	}

	let webhookUrl = "";
	let sslVerification = false;
	if (cluster.domains.length) {
		{
			webhookUrl = "https://" + cluster.domains[0] + "/tekton-" + pipelineId;
			sslVerification = true;
		}
	} else {
		const cluster = await getClusterRecord();
		webhookUrl = "http://" + cluster.ips[0] + "/tekton-" + pipelineId;
		sslVerification = false;
	}

	let webHookId = null;
	switch (gitRepoType) {
		case "github":
			webHookId = await createGithubWebhook(
				gitPat,
				gitRepoUrl,
				webhookUrl,
				secretToken,
				sslVerification
			);
			break;
		case "gitlab":
			webHookId = await createGitlabWebhook(
				gitPat,
				gitRepoUrl,
				webhookUrl,
				secretToken,
				gitBranch,
				sslVerification
			);
			break;
		default:
			throw new Error("Unknown repo type: " + gitRepoType);
	}

	if (webHookId) {
		// At this stage we have successfully created the webhook, update the container database with the webhook id
		axios
			.post(
				helper.getPlatformUrl() + "/v1/telemetry/set-webhook",
				{ container, webHookId },
				{
					headers: {
						Authorization: process.env.MASTER_TOKEN,
						"Content-Type": "application/json",
					},
				}
			)
			.catch((err) => {
				console.error(err);
			});
	}
}

export async function deleteTektonPipeline(
	container,
	environment,
	gitProvider
) {
	const { repo } = container;
	const gitRepoType = repo.type;
	const pipelineId = container.iid;
	const gitRepoUrl = repo.url;
	const hookId = repo.webHookId;
	const gitPat = gitProvider?.accessToken;
	const manifest = fs.readFileSync(
		`${__dirname}/manifests/${gitRepoType}-pipeline.yaml`,
		"utf8"
	);
	const resources = k8s.loadAllYaml(manifest);

	const group = "triggers.tekton.dev";
	const version = "v1beta1";

	for (const resource of resources) {
		try {
			const { kind, metadata } = resource;

			if (metadata.namespace) {
				var resource_namespace = metadata.namespace;
			}

			var resourceNameSuffix = "-" + pipelineId;
			resource.metadata.name += resourceNameSuffix;

			switch (kind) {
				case "ServiceAccount":
					await k8sCoreApi.deleteNamespacedServiceAccount(
						resource.metadata.name,
						resource_namespace
					);
					break;
				case "Secret":
					await k8sCoreApi.deleteNamespacedSecret(
						resource.metadata.name,
						resource_namespace
					);
					break;
				case "ClusterRoleBinding":
					await k8sAuthApi.deleteClusterRoleBinding(resource.metadata.name);
					break;
				case "RoleBinding":
					await k8sAuthApi.deleteNamespacedRoleBinding(
						resource.metadata.name,
						resource_namespace
					);
					break;
				case "Ingress":
					await k8sNetworkingApi.deleteNamespacedIngress(
						resource.metadata.name,
						resource_namespace
					);
					break;
				case "EventListener":
					await k8sCustomObjectApi.deleteNamespacedCustomObject(
						group,
						version,
						resource_namespace,
						"eventlisteners",
						resource.metadata.name
					);
					break;
				case "TriggerBinding":
					await k8sCustomObjectApi.deleteNamespacedCustomObject(
						group,
						version,
						resource_namespace,
						"triggerbindings",
						resource.metadata.name
					);
					break;
				case "TriggerTemplate":
					await k8sCustomObjectApi.deleteNamespacedCustomObject(
						group,
						version,
						resource_namespace,
						"triggertemplates",
						resource.metadata.name
					);
					break;
				default:
					console.info(`!!! Skipping: ${kind}`);
			}
			console.info(`${kind} ${resource.metadata.name} deleted...`);
		} catch (err) {
			console.error(
				`Error deleting tekton pipeline resource ${resource.kind} ${resource.metadata.name}...`,
				err.body?.message ?? err
			);
		}
	}

	switch (gitRepoType) {
		case "github":
			await deleteGithubWebhook(gitPat, gitRepoUrl, hookId);
			break;
		case "gitlab":
			await deleteGitlabWebhook(gitPat, gitRepoUrl, hookId);
			break;
		default:
			throw new Error("Unknown repo type: " + gitRepoType);
	}

	// At this stage we have successfully deleted the webhook, update the container database to remove the webhook id
	axios
		.post(
			helper.getPlatformUrl() + "/v1/telemetry/remove-webhook",
			{ container },
			{
				headers: {
					Authorization: process.env.MASTER_TOKEN,
					"Content-Type": "application/json",
				},
			}
		)
		.catch((error) => {
			console.info("Error updating github webhook in platform-core", error);
		});
}

function formatKubernetesName(name) {
	return name
		.split(" ")
		.map((word, index) => {
			if (index === 0) {
				return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
			} else {
				return word.charAt(0).toUpperCase() + word.slice(1);
			}
		})
		.join("");
}

async function createGithubWebhook(
	gitPat,
	gitRepoUrl,
	webhookUrl,
	secretToken,
	sslVerification = false
) {
	const octokit = new Octokit({ auth: gitPat });
	const path = new URL(gitRepoUrl).pathname;

	var githubHook = await octokit.request("POST /repos" + path + "/hooks", {
		owner: path.split("/")[1],
		repo: path.split("/")[2],
		name: "web",
		active: true,
		events: ["push"],
		config: {
			url: webhookUrl,
			content_type: "json",
			secret: secretToken,
			insecure_ssl: sslVerification ? "0" : "1", // "1" disables SSL verification; "0" enables it.
		},
		headers: {
			"X-GitHub-Api-Version": "2022-11-28",
		},
	});

	console.info("GitHub repo webhook created");
	return githubHook.data.id;
}

async function deleteGithubWebhook(gitPat, gitRepoUrl, hookId) {
	if (!gitPat || !gitRepoUrl || !hookId) return;
	try {
		const octokit = new Octokit({ auth: gitPat });
		const path = new URL(gitRepoUrl).pathname;

		await octokit.request("DELETE /repos" + path + "/hooks/" + hookId, {
			owner: path.split("/")[1],
			repo: path.split("/")[2],
			hook_id: hookId,
			headers: {
				"X-GitHub-Api-Version": "2022-11-28",
			},
		});
		console.info("GitHub repo webhook deleted");
	} catch (err) {
		console.error("Error deleting GitLab repo webhook", err);
	}
}

async function createGitlabWebhook(
	gitPat,
	gitRepoUrl,
	webhookUrl,
	secretToken,
	gitBranch,
	sslVerification = false
) {
	const gitlabUrl = new URL(gitRepoUrl);
	const apiPath = "/api/v4";
	const projectName = gitlabUrl.pathname.split("/")[2];
	gitlabUrl.pathname = apiPath;
	const gitlabApiBaseUrl = gitlabUrl.toString();

	// Step 1: Get User ID
	const responseUser = await fetch(`${gitlabApiBaseUrl}/user`, {
		headers: { "PRIVATE-TOKEN": gitPat },
	});
	if (!responseUser.ok) {
		throw new Error("Failed to fetch user data");
	}
	const user = await responseUser.json();
	const userId = user.id;

	// Step 2: Get All Project IDs Owned by User
	const responseProject = await fetch(
		`${gitlabApiBaseUrl}/users/${userId}/projects`,
		{
			headers: { "PRIVATE-TOKEN": gitPat },
		}
	);
	if (!responseProject.ok) {
		throw new Error("Failed to fetch project data");
	}
	const projects = await responseProject.json();

	// Step 3: Find Specific Project ID
	const project = projects.find((project) => project.name === projectName);
	if (!project) {
		console.error(`Project '${projectName}' not found.`);
		return;
	}
	const projectId = project.id;

	// Step 4: Create Webhook
	const webhookPayload = {
		url: webhookUrl,
		push_events: true,
		issues_events: false,
		merge_requests_events: false,
		tag_push_events: false,
		repository_update_events: false,
		enable_ssl_verification: sslVerification,
		token: secretToken,
		push_events_branch_filter: gitBranch,
	};
	const response = await fetch(
		`${gitlabApiBaseUrl}/projects/${projectId}/hooks`,
		{
			method: "POST",
			headers: {
				"PRIVATE-TOKEN": gitPat,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(webhookPayload),
		}
	);
	if (!response.ok) {
		throw new Error("Network response was not ok");
	}
	const webhook = await response.json();
	console.info("GitLab repo webhook created");

	return webhook.id;
}

async function deleteGitlabWebhook(gitPat, gitRepoUrl, hookId) {
	if (!gitPat || !gitRepoUrl || !hookId) return;
	try {
		const gitlabUrl = new URL(gitRepoUrl);
		const apiPath = "/api/v4";
		const projectName = gitlabUrl.pathname.split("/")[2];
		gitlabUrl.pathname = apiPath;
		const gitlabApiBaseUrl = gitlabUrl.toString();

		// Step 1: Get User ID
		const responseUser = await fetch(`${gitlabApiBaseUrl}/user`, {
			headers: { "PRIVATE-TOKEN": gitPat },
		});
		if (!responseUser.ok) {
			throw new Error("Failed to fetch GitLab user data");
		}
		const user = await responseUser.json();
		const userId = user.id;

		// Step 2: Get All Project IDs Owned by User
		const responseProject = await fetch(
			`${gitlabApiBaseUrl}/users/${userId}/projects`,
			{
				headers: { "PRIVATE-TOKEN": gitPat },
			}
		);
		if (!responseProject.ok) {
			throw new Error("Failed to fetch project data");
		}
		const projects = await responseProject.json();

		// Step 3: Find Specific Project ID
		const project = projects.find((project) => project.name === projectName);
		if (!project) {
			console.error(`Project '${projectName}' not found.`);
			return;
		}
		const projectId = project.id;

		// Step 4: Delete Webhook
		const response = await fetch(
			`${gitlabApiBaseUrl}/projects/${projectId}/hooks/${hookId}`,
			{
				method: "DELETE",
				headers: {
					"PRIVATE-TOKEN": gitPat,
					"Content-Type": "application/json",
				},
			}
		);
		if (!response.ok) {
			throw new Error("Network response was not ok");
		}
		console.info("GitLab repo webhook deleted");
	} catch (err) {
		console.error("Error deleting GitLab repo webhook", err);
	}
}
