import k8s from "@kubernetes/client-node";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Kubernetes client configuration
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sCustomApi = kc.makeApiClient(k8s.CustomObjectsApi);

const group = "acid.zalan.do";
const version = "v1";
const namespace = process.env.NAMESPACE;
const plural = "postgresqls";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createPostgresql(serverName, dbVersion, size, numInstances) {
    const manifest = fs.readFileSync(`${__dirname}/manifests/postgres.yaml`, "utf8");
    const resources = k8s.loadAllYaml(manifest);

    for (const resource of resources) {
        try {
            const { kind } = resource;

            switch (kind) {
                case "postgresql":
                    resource.metadata.name = serverName;
                    resource.spec.numberOfInstances = numInstances;
                    resource.spec.volume.size = size;
                    resource.spec.postgresql.version = dbVersion;
                    await k8sCustomApi.createNamespacedCustomObject(group, version, namespace, plural, resource);
                    break;
                default:
                    break;
                // console.log("Skipping: " + kind);
            }
            // console.log(kind + " " + resource.metadata.name + " created...");
        } catch (error) {
            // console.error("Error applying resource:", error.body);
            throw new AgnostError(error.body?.message);
        }
    }
    return "success";
}

export async function updatePostgresql(serverName, dbVersion, size, numInstances) {
    const patchData = {
        spec: {
            postgresql: {
                version: dbVersion,
            },
            numberOfInstances: numInstances,
            volume: {
                size: size,
            },
        },
    };

    const requestOptions = { headers: { "Content-Type": "application/merge-patch+json" } };

    try {
        await k8sCustomApi.patchNamespacedCustomObject(
            group,
            version,
            namespace,
            plural,
            serverName,
            patchData,
            undefined,
            undefined,
            undefined,
            requestOptions
        );
        // console.log("PostgreSQL " + serverName + " updated...");
    } catch (error) {
        // console.error("Error applying resource:", error.body);
        throw new AgnostError(error.body?.message);
    }

    return "success";
}

export async function deletePostgresql(serverName) {
    try {
        await k8sCustomApi.deleteNamespacedCustomObject(group, version, namespace, plural, serverName);
        // console.log("PostgreSQL " + serverName + " deleted...");
    } catch (error) {
        // console.error("Error applying resource:", error.body);
        throw new AgnostError(error.body?.message);
    }

    return "success";
}

// some helper functions
export async function waitForSecret(secretName) {
    const pollingInterval = 2000;
    while (true) {
        try {
            const response = await k8sCoreApi.readNamespacedSecret(secretName, namespace);
            return response.body.data.password;
        } catch (error) {
            await sleep(pollingInterval);
        }
    }
}

// Function to simulate sleep
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export async function restartPostgreSQL(resourceName) {
    try {
        const pgsql = await k8sCustomApi.getNamespacedCustomObject(group, version, namespace, plural, resourceName);

        // Increment the revision in the deployment template to trigger a rollout
        pgsql.body.spec.podAnnotations = {
            ...pgsql.body.spec.podAnnotations,
            "kubectl.kubernetes.io/restartedAt": new Date().toISOString(),
        };

        await k8sCustomApi.replaceNamespacedCustomObject(group, version, namespace, plural, resourceName, pgsql.body);
        // console.log(`Rollout restart ${resourceName} initiated successfully.`);
    } catch (error) {
        console.error("Error restarting resource:", error.body);
        throw new AgnostError(error.body?.message);
    }
}
