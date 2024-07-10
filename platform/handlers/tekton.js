import fs from "fs";
import crypto from "crypto";
import k8s from "@kubernetes/client-node";
import path from "path";
import axios from "axios";
import { Octokit } from "@octokit/core";
import { fileURLToPath } from "url";
import { getClusterRecord } from "./util.js";
import helper from "../util/helper.js";
import cntrCtrl from "../controllers/container.js";

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

/**
 * Creates a Tekton pipeline for the given container, environment, and git provider.
 * @param {object} container - The container object.
 * @param {object} environment - The environment object.
 * @param {object} gitProvider - The git provider object.
 * @param {object} session - The session object of the database transaction.
 * @returns {Promise<void>} - A promise that resolves when the Tekton pipeline is created.
 */
export async function createTektonPipeline(
	container,
	environment,
	gitProvider,
	session = null
) {
	// If the repo is not connected then return
	if (!container.repo?.connected || !gitProvider) return;

	const { repo } = container;
	const namespace = environment.iid;
	const gitRepoType = repo.type;
	const pipelineId = container.slug;
	const gitRepoUrl = repo.url;
	const gitPat = gitProvider.accessToken;
	const gitBranch = repo.branch;
	const gitSubPath = repo.path;
	const appKind = formatKubernetesName(container.type);
	const appName = container.iid;
	const dockerfile = repo.dockerfile;
	const containerImageName = container.slug;
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
					// If cluster has SSL settings and a custom domain then also add these to the API server ingress
					if (cluster.domains.length > 0 || cluster.reverseProxyURL) {
						resource.metadata.annotations["kubernetes.io/ingress.class"] =
							"nginx";

						resource.spec.tls = cluster.domains.map((domainName) => {
							return {
								hosts: [domainName],
							};
						});

						for (const domainName of cluster.domains) {
							resource.spec.rules.unshift({
								host: domainName,
								http: {
									paths: [
										{
											path: `/tekton-${pipelineId}(/|$)(.*)`,
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

					await k8sNetworkingApi.createNamespacedIngress(
						resource_namespace,
						resource
					);
					break;
				case "EventListener":
					resource.spec.triggers[0].interceptors[0].params[0].value.secretName +=
						resourceNameSuffix;
					if (gitProvider.provider === "bitbucket") {
						resource.spec.triggers[0].interceptors[1].params[0].value = `body.push.changes[0].new.name == '${gitBranch}'`;
					} else {
						resource.spec.triggers[0].interceptors[1].params[0].value = `body.ref == 'refs/heads/${gitBranch}'`;
					}
					resource.spec.triggers[0].bindings[0].ref += resourceNameSuffix;
					resource.spec.triggers[0].template.ref += resourceNameSuffix;
					resource.spec.resources.kubernetesResource.spec.template.spec.serviceAccountName +=
						resourceNameSuffix;
					if (gitSubPath != "/" && gitProvider.provider !== "bitbucket") {
						// remove leading slash, if exists
						let path = gitSubPath.replace(/^\/+/, "");
						resource.spec.triggers[0].interceptors[1].params[1].name = "filter";
						resource.spec.triggers[0].interceptors[1].params[1].value = `
								size(body.commits) > 0 && 
								body.commits.exists(c, 
									(size(c.modified) > 0 && c.modified.exists(m, m.startsWith("${path}"))) || 
									(size(c.added) > 0 && c.added.exists(a, a.startsWith("${path}"))) || 
									(size(c.removed) > 0 && c.removed.exists(r, r.startsWith("${path}")))
								)
								`;
					} else {
						// remove the filter interceptor
						// Note that the bitbucket push evnet does not provide added, modified and removed files information similar to github and gitlab
						// Currently we do not apply this filter for bitbucket and build all the repo again in case of changes
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
					resource.spec.params[2].value = agnostNamespace;
					resource.spec.params[3].value = namespace;
					resource.spec.params[4].value = "zot." + agnostNamespace + ":5000";
					resource.spec.params[5].value = gitPat;
					resource.spec.params[6].value = gitBranch;
					resource.spec.params[7].value = gitSubPath.replace(/^\/+/, ""); // remove leading slash, if exists
					resource.spec.params[8].value = containerImageName;
					resource.spec.params[9].value = dockerfile.replace(/^\/+/, ""); // remove leading slash, if exists
					var taskrunParams = resource.spec.params;
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
						resource.spec.resourcetemplates[0].spec.serviceAccountName +=
							resourceNameSuffix;
						var taskrunSpec = resource.spec.resourcetemplates[0].spec;
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
				`Error applying tekton pipeline resource ${resource.kind} ${
					resource.metadata.name
				}. ${err.response?.body?.message ?? err.message}`
			);
			throw err;
		}
	}

	// Run the initial pipeline
	try {
		const specString = JSON.stringify(taskrunSpec).replace(/tt\.params/g, 'params');
		const populatedSpec = JSON.parse(specString);
		const path = new URL(gitRepoUrl).pathname;

		// Need to populate params that comes with Webhook call
		taskrunParams[10].value = 'abc1234';
		taskrunParams[11].value = gitRepoUrl;
		taskrunParams[12].value = 'agnost-gitops';
		taskrunParams[13].value = gitRepoUrl + '/commit/abc1234';
		taskrunParams[14].value = gitRepoUrl;
		taskrunParams[15].value = path.split('/')[2];
		taskrunParams[16].value = "Initial TaskRun";
		taskrunParams[17].value = new Date().toISOString();
		populatedSpec.params = taskrunParams;

		const taskrunResource = {
			apiVersion: 'tekton.dev/v1',
			kind: 'TaskRun',
			metadata: {
				name: 'manual-run-' + pipelineId
			},
			spec: populatedSpec
		};

		await k8sCustomObjectApi.createNamespacedCustomObject(
			'tekton.dev',
			'v1',
			'tekton-builds',
			'taskruns',
			taskrunResource
		);
	} catch (err) {
		console.error(
			`Error applying tekton pipeline resource ${taskrunResource.kind} ${
				taskrunResource.metadata.name
			}. ${err.response?.body?.message ?? err.message}`
		);
		throw err;
	}

	let webhookUrl = "";
	let sslVerification = false;
	if (cluster.domains.length) {
		{
			webhookUrl = "https://" + cluster.domains[0] + `/tekton-${pipelineId}`;
			sslVerification = true;
		}
	} else if (cluster.reverseProxyURL) {
		// Pick the domain part from the reverse proxy URL
		const match = cluster.reverseProxyURL.match(/https?:\/\/([^\/]+)/);
		if (match) {
			const domain = match[1];
			webhookUrl = "https://" + domain + `/tekton-${pipelineId}`;
			sslVerification = false;
		}
	} else {
		webhookUrl = "http://" + cluster.ips[0] + `/tekton-${pipelineId}`;
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
				repo.repoId,
				webhookUrl,
				secretToken,
				gitBranch,
				sslVerification
			);
			break;
		case "bitbucket":
			webHookId = await createBitbucketWebhook(
				gitPat,
				repo.name,
				webhookUrl,
				secretToken
			);
			break;
		default:
			throw new Error("Unknown repo type: " + gitRepoType);
	}

	if (webHookId) {
		// At this stage we have successfully created the webhook, update the container database with the webhook id
		await cntrCtrl.updateOneById(
			container._id,
			{ "repo.webHookId": webHookId },
			{},
			{ cacheKey: container._id, session }
		);
	}
}

/**
 * Deletes a Tekton pipeline.
 * @param {object} container - The container object.
 * @param {object} gitProvider - The git provider object.
 * @param {object} session - The session object of the database transaction.
 * @param {boolean} [updateDb=true] - Whether to update the database after deleting the pipeline.
 * @returns {Promise<void>} - A promise that resolves when the pipeline is deleted.
 */
export async function deleteTektonPipeline(
	container,
	gitProvider,
	session = null,
	updateDb = true
) {
	// If the repo is not connected then return
	if (!container.repo?.connected || !gitProvider) return;

	const { repo } = container;
	const gitRepoType = repo.type;
	const pipelineId = container.slug;
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
				`Error deleting tekton pipeline resource ${resource.kind} ${
					resource.metadata.name
				}. ${err.response?.body?.message ?? err.message}`
			);
		}
	}

	switch (gitRepoType) {
		case "github":
			await deleteGithubWebhook(gitPat, gitRepoUrl, hookId);
			break;
		case "gitlab":
			await deleteGitlabWebhook(gitPat, repo.repoId, hookId);
			break;
		case "bitbucket":
			await deleteBitbucketWebhook(gitPat, repo.name, hookId);
			break;
		default:
			throw new Error("Unknown repo type: " + gitRepoType);
	}

	if (updateDb === true) {
		// At this stage we have successfully deleted the webhook, update the container database to remove the webhook id
		await cntrCtrl.updateOneById(
			container._id,
			{},
			{ "repo.webHookId": "" },
			{ cacheKey: container._id, session }
		);
	}
}

/**
 * Deletes a list of Tekton pipelines.
 * @param {object} containers - The list of container objects whose build pipelines will be deleted.
 * @returns {Promise<void>} - A promise that resolves when the pipelines are deleted.
 */
export async function deleteTektonPipelines(containers) {
	if (!containers || containers.length === 0) return;

	for (const container of containers) {
		if (!(container.repo?.connected && container.repo?.gitProviderId?._id))
			continue;

		// We lookup for git provider informatin when retrieving the containers from the database but we do not decrypt the tokens
		// So we need to decrypt the tokens before we can use them
		const gitProvider = container.repo.gitProviderId;
		if (gitProvider.accessToken)
			gitProvider.accessToken = helper.decryptText(gitProvider.accessToken);
		if (gitProvider.refreshToken)
			gitProvider.refreshToken = helper.decryptText(gitProvider.refreshToken);

		await deleteTektonPipeline(container, gitProvider, null, false);
	}
}

/**
 * Formats the given Kubernetes name.
 *
 * @param {string} name - The name to be formatted.
 * @returns {string} The formatted Kubernetes name.
 */
function formatKubernetesName(name) {
	if (name === "deployment") return "Deployment";
	else if (name === "statefulset") return "StatefulSet";
	else return "CronJob";
}

/**
 * Creates a GitHub webhook for a given repository.
 *
 * @param {string} gitPat - The personal access token (PAT) for authenticating with GitHub.
 * @param {string} gitRepoUrl - The URL of the GitHub repository.
 * @param {string} webhookUrl - The URL where the webhook events will be sent.
 * @param {string} secretToken - The secret token used to sign the webhook events.
 * @param {boolean} [sslVerification=false] - Whether to enable SSL verification for the webhook.
 * @returns {number} - The ID of the created GitHub webhook.
 * @throws {Error} - If the GitHub repo webhook creation fails.
 */
async function createGithubWebhook(
	gitPat,
	gitRepoUrl,
	webhookUrl,
	secretToken,
	sslVerification = false
) {
	const octokit = new Octokit({ auth: gitPat });
	const path = new URL(gitRepoUrl).pathname;

	try {
		const githubHook = await octokit.request("POST /repos" + path + "/hooks", {
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
	} catch (err) {
		console.error(
			`Cannot create the GitHub repo webhook. ${JSON.stringify(
				err.response?.data
			)}`
		);

		throw err;
	}
}

/**
 * Deletes a GitHub webhook from a repository.
 *
 * @param {string} gitPat - The personal access token for authenticating with GitHub.
 * @param {string} gitRepoUrl - The URL of the GitHub repository.
 * @param {number} hookId - The ID of the webhook to delete.
 * @returns {Promise<void>} - A promise that resolves when the webhook is deleted successfully.
 */
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
		console.error(
			`Error deleting GitHub repo webhook. ${JSON.stringify(
				err.response?.data
			)}`
		);
	}
}

/**
 * Creates a GitLab webhook for a specific repository.
 *
 * @param {string} gitPat - The GitLab personal access token.
 * @param {string} projectId - The GitLab project ID.
 * @param {string} webhookUrl - The URL of the webhook to be created.
 * @param {string} secretToken - The secret token for the webhook.
 * @param {string} gitBranch - The branch to filter push events for the webhook.
 * @param {boolean} [sslVerification=false] - Whether to enable SSL verification for the webhook.
 * @returns {Promise<number>} The ID of the created webhook.
 * @throws {Error} If there is an error during the webhook creation process.
 */
async function createGitlabWebhook(
	gitPat,
	projectId,
	webhookUrl,
	secretToken,
	gitBranch,
	sslVerification = false
) {
	try {
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

		const response = await axios.post(
			`https://gitlab.com/api/v4/projects/${projectId}/hooks`,
			webhookPayload,
			{
				headers: {
					Authorization: `Bearer ${gitPat}`,
					"Content-Type": "application/json",
				},
			}
		);

		console.info("GitLab project webhook created");
		return response.data.id;
	} catch (err) {
		console.error(
			`Cannot create the GitLab project webhook. ${JSON.stringify(
				err.response?.data
			)}`
		);

		throw err;
	}
}

/**
 * Deletes a GitLab webhook.
 *
 * @param {string} gitPat - The GitLab personal access token.
 * @param {string} projectId - The GitLab project ID.
 * @param {number} hookId - The ID of the webhook to delete.
 * @returns {Promise<void>} - A promise that resolves when the webhook is deleted successfully, or rejects with an error.
 */
async function deleteGitlabWebhook(gitPat, projectId, hookId) {
	if (!gitPat || !projectId || !hookId) return;

	try {
		await axios.delete(
			`https://gitlab.com/api/v4/projects/${projectId}/hooks/${hookId}`,
			{
				headers: {
					Authorization: `Bearer ${gitPat}`,
					"Content-Type": "application/json",
				},
			}
		);

		console.info("GitLab project webhook deleted");
	} catch (err) {
		console.error(
			`Error deleting GitLab project webhook. ${JSON.stringify(
				err.response?.data
			)}`
		);
	}
}

/**
 * Creates a Bitbucket repository webhook.
 *
 * @param {string} gitPat - The personal access token for authenticating with Bitbucket API.
 * @param {string} repoName - The name of the repository in the format of "{workspace}/{repo_slug}".
 * @param {string} webhookUrl - The URL to receive webhook events.
 * @param {string} secretToken - The secret token for verifying the authenticity of webhook events.
 * @returns {string} The UUID of the created webhook.
 * @throws {Error} If the Bitbucket repository webhook creation fails.
 */
async function createBitbucketWebhook(
	gitPat,
	repoName,
	webhookUrl,
	secretToken
) {
	try {
		const webhookPayload = {
			description: "Agnost Webhok",
			url: webhookUrl,
			active: true,
			secret: secretToken,
			events: ["repo:push"],
		};

		const response = await axios.post(
			`https://api.bitbucket.org/2.0/repositories/${repoName}/hooks`,
			webhookPayload,
			{
				headers: {
					Authorization: `Bearer ${gitPat}`,
					Accept: "application/json",
				},
			}
		);

		console.info("Bitbucket repository webhook created");
		return response.data.uuid;
	} catch (err) {
		console.error(
			`Cannot create the Bitbucket repository webhook. ${JSON.stringify(
				err.response?.data
			)}`
		);

		throw err;
	}
}

/**
 * Deletes a Bitbucket repository webhook.
 *
 * @param {string} gitPat - The personal access token for authenticating with Bitbucket API.
 * @param {string} repoName - The name of the repository in the format of "{workspace}/{repo_slug}".
 * @param {string} hookId - The ID of the webhook to be deleted.
 * @returns {Promise<void>} - A promise that resolves when the webhook is successfully deleted.
 */
async function deleteBitbucketWebhook(gitPat, repoName, hookId) {
	if (!gitPat || !repoName || !hookId) return;

	try {
		await axios.delete(
			`https://api.bitbucket.org/2.0/repositories/${repoName}/hooks/${hookId}`,
			{
				headers: {
					Authorization: `Bearer ${gitPat}`,
				},
			}
		);

		console.info("Bitbucket repository webhook deleted");
	} catch (err) {
		console.error(
			`Error deleting Bitbuckeet repository webhook. ${JSON.stringify(
				err.response?.data
			)}`
		);
	}
}

export async function updateTriggerTemplateAccessTokens(
	containers,
	provider,
	accessToken
) {
	if (!containers || containers.length === 0) return;
	// Iterage over the containers
	for (const container of containers) {
		try {
			// Get the TriggerBinding object
			const payload = await k8sCustomObjectApi.getNamespacedCustomObject(
				"triggers.tekton.dev",
				"v1beta1",
				"tekton-builds",
				"triggerbindings",
				`${provider}-push-binding-${container.slug}`
			);

			const { metadata, spec } = payload.body;
			spec.params = spec.params.map((param) => {
				if (param.name === "gitlabpat" && provider === "gitlab") {
					param.value = accessToken;
				} else if (param.name === "bitbucketpat" && provider === "bitbucket") {
					param.value = accessToken;
				}
				return param;
			});

			// Update the TriggerBinding object
			await k8sCustomObjectApi.replaceNamespacedCustomObject(
				"triggers.tekton.dev",
				"v1beta1",
				"tekton-builds",
				"triggerbindings",
				metadata.name,
				payload.body
			);
		} catch (err) {
			console.error(
				`Error updating tekton triggerbinding resource '${provider}-push-binding-${
					container.slug
				}' for updated access token. ${
					err.response?.body?.message ?? err.message
				}`
			);
		}
	}
}
