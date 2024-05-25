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

const group = "mongodbcommunity.mongodb.com";
const version = "v1";
const namespace = process.env.NAMESPACE;
const plural = "mongodbcommunity";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function calculateLogStorageSize(storageSize) {
    // Parse the storage size and unit
    const [, size, unit] = storageSize.match(/(\d+)([A-Za-z]+)/);

    // Convert the size to bytes
    let bytes = parseInt(size);
    switch (unit.toLowerCase()) {
        case "ki":
            bytes *= 1024;
            break;
        case "mi":
            bytes *= Math.pow(1024, 2);
            break;
        case "gi":
            bytes *= Math.pow(1024, 3);
            break;
        // Default to bytes if the unit is not recognized
        default:
            break;
    }

    const twentyPercent = 0.2 * bytes;

    // Format the result back to the original unit
    if (twentyPercent >= Math.pow(1024, 3)) {
        return `${Math.ceil(twentyPercent / Math.pow(1024, 3))}Gi`;
    } else if (twentyPercent >= Math.pow(1024, 2)) {
        return `${Math.ceil(twentyPercent / Math.pow(1024, 2))}Mi`;
    } else if (twentyPercent >= 1024) {
        return `${Math.ceil(twentyPercent / 1024)}Ki`;
    } else {
        return `${Math.ceil(twentyPercent)}`;
    }
}

export async function createMongoDBResource(mongoName, mongoVersion, size, userName, passwd, replicaCount) {
    const manifest = fs.readFileSync(`${__dirname}/manifests/mongodbcommunity.yaml`, "utf8");
    const resources = k8s.loadAllYaml(manifest);

    for (const resource of resources) {
        try {
            const { kind } = resource;

            switch (kind) {
                case "Secret":
                    resource.metadata.name = mongoName + "-user";
                    resource.stringData.password = passwd;
                    k8sCoreApi.createNamespacedSecret(namespace, resource);
                    break;
                case "MongoDBCommunity":
                    resource.metadata.name = mongoName;
                    resource.spec.members = replicaCount;
                    resource.spec.version = mongoVersion;
                    resource.spec.users[0].name = userName;
                    resource.spec.users[0].passwordSecretRef.name = mongoName + "-user";
                    resource.spec.users[0].scramCredentialsSecretName = mongoName + "-user";
                    resource.spec.statefulSet.spec.selector.matchLabels.app = mongoName + "-svc";
                    resource.spec.statefulSet.spec.template.metadata.labels.app = mongoName + "-svc";
                    resource.spec.statefulSet.spec.volumeClaimTemplates[0].spec.resources.requests.storage = size;
                    const logStorageSize = calculateLogStorageSize(size);
                    resource.spec.statefulSet.spec.volumeClaimTemplates[1].spec.resources.requests.storage =
                        logStorageSize;
                    await k8sCustomApi.createNamespacedCustomObject(group, version, namespace, plural, resource);
                    break;
                default:
                    break;
                // console.log("Skipping: " + kind);
            }
            // console.log(kind + " " + resource.metadata.name + " created...");
        } catch (error) {
            // console.error("Error applying resource:", error);
            throw new AgnostError(error.body?.message);
        }
    }
    return "success";
}

export async function updateMongoDBResource(mongoName, mongoVersion, size, replicaCount) {
    const patchData = {
        spec: {
            version: mongoVersion,
            members: replicaCount,
        },
    };
    const dataPvcPatch = {
        spec: {
            resources: {
                requests: {
                    storage: size,
                },
            },
        },
    };
    const logStorageSize = calculateLogStorageSize(size);
    const logPvcPatch = { spec: { resources: { requests: { storage: logStorageSize } } } };
    const requestOptions = { headers: { "Content-Type": "application/merge-patch+json" } };

    console.log("****", size, logStorageSize);

    try {
        await k8sCustomApi.patchNamespacedCustomObject(
            group,
            version,
            namespace,
            plural,
            mongoName,
            patchData,
            undefined,
            undefined,
            undefined,
            requestOptions
        );
        // console.log("MongoDB " + mongoName + " updated...");

        const pvcList = await k8sCoreApi.listNamespacedPersistentVolumeClaim(namespace);
        pvcList.body.items.forEach(async (pvc) => {
            try {
                var pvcName = pvc.metadata.name;
                if (pvcName.includes("data-volume-" + mongoName + "-")) {
                    console.log("Updating data volume");
                    await k8sCoreApi.patchNamespacedPersistentVolumeClaim(
                        pvcName,
                        namespace,
                        dataPvcPatch,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        requestOptions
                    );
                    console.log("PersistentVolumeClaim " + pvcName + " updated...", size);
                } else if (pvcName.includes("logs-volume-" + mongoName + "-")) {
                    console.log("Updating logs volume");
                    await k8sCoreApi.patchNamespacedPersistentVolumeClaim(
                        pvcName,
                        namespace,
                        logPvcPatch,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        requestOptions
                    );
                    console.log("PersistentVolumeClaim " + pvcName + " updated...", logStorageSize);
                }
            } catch (err) {}
        });
    } catch (error) {
        // console.error("Error updating MongoDB " + mongoName + " resources...", error.body);
        throw new AgnostError(error.body?.message);
    }

    return "success";
}

export async function deleteMongoDBResource(mongoName) {
    try {
        try {
            await k8sCustomApi.deleteNamespacedCustomObject(group, version, namespace, plural, mongoName);
        } catch (err) {}
        // console.log("MongoDB " + mongoName + " deleted...");
        try {
            await k8sCoreApi.deleteNamespacedSecret(mongoName + "-user", namespace);
        } catch (err) {}
        // console.log("Secret " + mongoName + "-user deleted...");

        const pvcList = await k8sCoreApi.listNamespacedPersistentVolumeClaim(namespace);
        pvcList.body.items.forEach(async (pvc) => {
            var pvcName = pvc.metadata.name;
            if (
                pvcName.includes("logs-volume-" + mongoName + "-") ||
                pvcName.includes("data-volume-" + mongoName + "-")
            ) {
                try {
                    await k8sCoreApi.deleteNamespacedPersistentVolumeClaim(pvcName, namespace);
                } catch (err) {}
                // console.log("PersistentVolumeClaim " + pvcName + " deleted...");
            }
        });
    } catch (error) {
        // console.error("Error deleting resource:", error.body);
        throw new AgnostError(error.body?.message);
    }

    return "success";
}

export async function restartMongoDB(resourceName) {
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
        console.error("Error restarting resource:", resourceName, error);
        throw new AgnostError(error.body?.message);
    }
}
