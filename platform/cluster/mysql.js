import k8s from "@kubernetes/client-node";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Kubernetes client configuration
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sCustomApi = kc.makeApiClient(k8s.CustomObjectsApi);
const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);

const group = "mysql.oracle.com";
const version = "v2";
const namespace = process.env.NAMESPACE;
const plural = "innodbclusters";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createMySQLResource(clusterName, dbVersion, replicaCount, size, userName, passwd) {
    const manifest = fs.readFileSync(`${__dirname}/manifests/mysql.yaml`, "utf8");
    const resources = k8s.loadAllYaml(manifest);

    for (const resource of resources) {
        try {
            const { kind } = resource;

            switch (kind) {
                case "ServiceAccount":
                    resource.metadata.name = clusterName + "-sa";
                    await k8sCoreApi.createNamespacedServiceAccount(namespace, resource);
                    break;
                case "Secret":
                    resource.metadata.name = clusterName + "-cluster-secret";
                    resource.stringData.rootUser = userName;
                    resource.stringData.rootPassword = passwd;
                    await k8sCoreApi.createNamespacedSecret(namespace, resource);
                    break;
                case "InnoDBCluster":
                    resource.metadata.name = clusterName;
                    resource.spec.instances = replicaCount;
                    resource.spec.version = dbVersion;
                    resource.spec.serviceAccountName = clusterName + "-sa";
                    resource.spec.router.version = dbVersion;
                    resource.spec.secretName = clusterName + "-cluster-secret";
                    resource.spec.datadirVolumeClaimTemplate.resources.requests.storage = size;
                    await k8sCustomApi.createNamespacedCustomObject(group, version, namespace, plural, resource);
                    break;
                default:
                    console.log("Skipping: " + kind);
                    break;
            }
            console.log(kind + " " + resource.metadata.name + " created...");
        } catch (error) {
            console.error("Error applying resource:", error.body);
            throw new AgnostError(error.body?.message);
        }
    }
    return "success";
}

export async function updateMySQLResource(clusterName, dbVersion, replicaCount, size) {
    const patchData = {
        spec: {
            version: dbVersion,
            router: {
                version: dbVersion,
            },
            instances: replicaCount,
            datadirVolumeClaimTemplate: {
                resources: {
                    requests: {
                        storage: size,
                    },
                },
            },
        },
    };
    const pvcPatch = {
        spec: {
            resources: {
                requests: {
                    storage: size,
                },
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
            clusterName,
            patchData,
            undefined,
            undefined,
            undefined,
            requestOptions
        );
        console.log("MySQL " + clusterName + " updated...");

        const pvcList = await k8sCoreApi.listNamespacedPersistentVolumeClaim(namespace);
        pvcList.body.items.forEach(async (pvc) => {
            var pvcName = pvc.metadata.name;
            if (pvcName.includes("datadir-" + clusterName + "-")) {
                await k8sCoreApi.patchNamespacedPersistentVolumeClaim(
                    pvcName,
                    namespace,
                    pvcPatch,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    requestOptions
                );
                console.log("PersistentVolumeClaim " + pvcName + " updated...");
            }
        });
    } catch (error) {
        console.error("Error updating MySQL " + clusterName + " resources...", error.body);
        throw new AgnostError(error.body?.message);
    }

    return { result: "success" };
}

export async function deleteMySQLResource(clusterName) {
    try {
        try {
            await k8sCustomApi.deleteNamespacedCustomObject(group, version, namespace, plural, clusterName);
        } catch (err) {}
        console.log("MySQL " + clusterName + " deleted...");
        try {
            await k8sCoreApi.deleteNamespacedSecret(clusterName + "-cluster-secret", namespace);
        } catch (err) {}
        console.log("Secret " + clusterName + "-cluster-secret deleted...");
        try {
            await k8sCoreApi.deleteNamespacedServiceAccount(clusterName + "-sa", namespace);
        } catch (err) {}
        console.log("ServiceAccount " + clusterName + "-sa deleted...");

        const pvcList = await k8sCoreApi.listNamespacedPersistentVolumeClaim(namespace);
        pvcList.body.items.forEach(async (pvc) => {
            var pvcName = pvc.metadata.name;
            if (pvcName.includes("datadir-" + clusterName + "-")) {
                await k8sCoreApi.deleteNamespacedPersistentVolumeClaim(pvcName, namespace);
                console.log("PersistentVolumeClaim " + pvcName + " deleted...");
            }
        });
    } catch (error) {
        console.error("Error deleting resource:", error.body);
        throw new AgnostError(error.body?.message);
    }

    return { result: "success" };
}

export async function restartMySQL(resourceName) {
    try {
        const sts = await k8sAppsApi.readNamespacedStatefulSet(resourceName, namespace);

        // Increment the revision in the deployment template to trigger a rollout
        sts.body.spec.template.metadata.annotations = {
            ...sts.body.spec.template.metadata.annotations,
            "kubectl.kubernetes.io/restartedAt": new Date().toISOString(),
        };

        await k8sAppsApi.replaceNamespacedStatefulSet(resourceName, namespace, sts.body);
        // console.log(`Rollout restart ${resourceName} initiated successfully.`);
    } catch (error) {
        console.error("Error restarting resource:", error.body);
        throw new AgnostError(error.body?.message);
    }
}
