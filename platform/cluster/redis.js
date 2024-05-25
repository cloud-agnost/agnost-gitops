import k8s from "@kubernetes/client-node";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Kubernetes client configuration
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sApi = kc.makeApiClient(k8s.AppsV1Api);

const namespace = process.env.NAMESPACE;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createRedis(clusterName, version, size, passwd, readReplicaEnabled) {
    if (readReplicaEnabled) {
        var manifest = fs.readFileSync(`${__dirname}/manifests/redis-replication.yaml`, "utf8");
    } else {
        var manifest = fs.readFileSync(`${__dirname}/manifests/redis-standalone.yaml`, "utf8");
    }

    try {
        const resources = k8s.loadAllYaml(manifest);

        for (const resource of resources) {
            const { kind } = resource;

            switch (kind) {
                case "Secret":
                    resource.metadata.name = clusterName + "-redis-password";
                    resource.stringData.password = passwd;
                    await k8sCoreApi.createNamespacedSecret(namespace, resource);
                    break;
                case "Service":
                    switch (resource.metadata.name) {
                        case "redis-headless":
                            resource.metadata.name = clusterName + "-headless";
                            break;
                        case "redis-master":
                            resource.metadata.name = clusterName + "-master";
                            break;
                        case "redis-replicas":
                            resource.metadata.name = clusterName + "-replicas";
                            break;
                    }
                    resource.metadata.labels["app.kubernetes.io/instance"] = clusterName;
                    resource.spec.selector["app.kubernetes.io/instance"] = clusterName;
                    const serviceResult = await k8sCoreApi.createNamespacedService(namespace, resource);
                    break;
                case "ServiceAccount":
                    resource.metadata.name = clusterName + "-svc-acc";
                    resource.metadata.labels["app.kubernetes.io/instance"] = clusterName;
                    await k8sCoreApi.createNamespacedServiceAccount(namespace, resource);
                    break;
                case "StatefulSet":
                    switch (resource.metadata.name) {
                        case "redis-replicas":
                            resource.metadata.name = clusterName + "-replicas";
                            resource.spec.template.spec.containers[0].image = "docker.io/bitnami/redis:" + version;
                            resource.spec.template.spec.containers[0].env[1].valueFrom.secretKeyRef.name =
                                clusterName + "-redis-password";
                            resource.spec.template.spec.containers[0].env[2].value =
                                clusterName +
                                "-master-0." +
                                clusterName +
                                "-headless." +
                                namespace +
                                ".svc.cluster.local";
                            break;
                        case "redis-master":
                            resource.metadata.name = clusterName + "-master";
                            break;
                    }
                    resource.spec.volumeClaimTemplates[0].spec.resources.requests.storage = size;
                    resource.spec.serviceName = clusterName + "-headless";
                    resource.spec.template.spec.serviceAccountName = clusterName + "-svc-acc";
                    resource.spec.template.spec.containers[0].image = "docker.io/bitnami/redis:" + version;
                    resource.spec.template.spec.containers[0].env[0].valueFrom.secretKeyRef.name =
                        clusterName + "-redis-password";
                    resource.spec.template.spec.containers[0].resources.limits.memory = size;
                    resource.spec.template.spec.volumes[0].configMap.name = clusterName + "-redis-scripts";
                    // decimal 493 equals to Octal 755
                    resource.spec.template.spec.volumes[0].configMap.defaultMode = 493;
                    resource.spec.template.spec.volumes[1].configMap.name = clusterName + "-redis-health";
                    resource.spec.template.spec.volumes[1].configMap.defaultMode = 493;
                    resource.spec.template.spec.volumes[2].configMap.name = clusterName + "-redis-configuration";
                    // label updates
                    resource.metadata.labels["app.kubernetes.io/instance"] = clusterName;
                    resource.spec.selector.matchLabels["app.kubernetes.io/instance"] = clusterName;
                    resource.spec.template.metadata.labels["app.kubernetes.io/instance"] = clusterName;
                    resource.spec.template.spec.affinity.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[0].podAffinityTerm.labelSelector.matchLabels[
                        "app.kubernetes.io/instance"
                    ] = clusterName;
                    resource.spec.volumeClaimTemplates[0].metadata.labels["app.kubernetes.io/instance"] = clusterName;
                    await k8sApi.createNamespacedStatefulSet(namespace, resource);
                    break;
                case "ConfigMap":
                    switch (resource.metadata.name) {
                        case "redis-configuration":
                            resource.metadata.name = clusterName + "-redis-configuration";
                            break;
                        case "redis-health":
                            resource.metadata.name = clusterName + "-redis-health";
                            break;
                        case "redis-scripts":
                            resource.metadata.name = clusterName + "-redis-scripts";
                            break;
                    }
                    resource.metadata.labels["app.kubernetes.io/instance"] = clusterName;
                    await k8sCoreApi.createNamespacedConfigMap(namespace, resource);
                    break;
                default:
                    break;
            }
            // console.log(kind + " " + resource.metadata.name + " created...");
        }
        return "success";
    } catch (err) {
        throw new AgnostError(err.body?.message);
    }
}

export async function updateRedis(clusterName, version, size, readReplicaEnabled) {
    try {
        const sts = await k8sApi.readNamespacedStatefulSet(clusterName + "-master", namespace);
        sts.body.spec.template.spec.containers[0].image = "docker.io/bitnami/redis:" + version;
        if (!sts.body.spec.template.spec.containers[0].resources?.limits)
            sts.body.spec.template.spec.containers[0].resources = { limits: { memory: size } };
        else sts.body.spec.template.spec.containers[0].resources.limits.memory = size;

        var pvcName = "redis-data-" + clusterName + "-master-0";
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

        await k8sApi.replaceNamespacedStatefulSet(clusterName + "-master", namespace, sts.body);
        // console.log("StatefulSet " + clusterName + "-master updated...");

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
        // console.log("PVC " + pvcName + " updated...");

        if (readReplicaEnabled) {
            const replica = await k8sApi.readNamespacedStatefulSet(clusterName + "-replicas", namespace);
            replica.body.spec.template.spec.containers[0].image = "docker.io/bitnami/redis:" + version;
            replica.body.spec.template.spec.containers[0].resources.limits.memory = size;

            await k8sApi.replaceNamespacedStatefulSet(clusterName + "-replicas", namespace, replica.body);
            // console.log("StatefulSet " + clusterName + "-replicas updated...");

            var pvcNameReplica = "redis-data-" + clusterName + "-replicas-0";

            await k8sCoreApi.patchNamespacedPersistentVolumeClaim(
                pvcNameReplica,
                namespace,
                pvcPatch,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                requestOptions
            );

            // console.log("PVC " + pvcNameReplica + " updated...");
        }

        return "success";
    } catch (err) {
        throw new AgnostError(err.body?.message);
    }
}

export async function deleteRedis(clusterName) {
    try {
        await k8sApi.deleteNamespacedStatefulSet(clusterName + "-master", namespace);
        // console.log("StatefulSet " + clusterName + "-master deleted...");
        await k8sCoreApi.deleteNamespacedService(clusterName + "-master", namespace);
        // console.log("Service " + clusterName + "-master deleted...");
        await k8sCoreApi.deleteNamespacedService(clusterName + "-headless", namespace);
        // console.log("Service " + clusterName + "-headless deleted...");
        await k8sCoreApi.deleteNamespacedConfigMap(clusterName + "-redis-scripts", namespace);
        // console.log("ConfigMap " + clusterName + "-redis-scripts deleted...");
        await k8sCoreApi.deleteNamespacedConfigMap(clusterName + "-redis-health", namespace);
        // console.log("ConfigMap " + clusterName + "-redis-health deleted...");
        await k8sCoreApi.deleteNamespacedConfigMap(clusterName + "-redis-configuration", namespace);
        // console.log("ConfigMap " + clusterName + "-redis-configuration deleted...");
        await k8sCoreApi.deleteNamespacedServiceAccount(clusterName + "-svc-acc", namespace);
        // console.log("ServiceAccount " + clusterName + "-svc-acc deleted...");
        await k8sCoreApi.deleteNamespacedSecret(clusterName + "-redis-password", namespace);
        // console.log("Secret " + clusterName + "-credentials deleted...");

        var pvcName = "redis-data-" + clusterName + "-master-0";
        await k8sCoreApi.deleteNamespacedPersistentVolumeClaim(pvcName, namespace);
        // console.log("PersistentVolumeClaim " + pvcName + " deleted...");
    } catch (err) {
        throw new AgnostError(err.body?.message);
    }

    // check if it has read replicas
    try {
        await k8sApi.deleteNamespacedStatefulSet(clusterName + "-replicas", namespace);
        // console.log("StatefulSet " + clusterName + "-replicas deleted...");
        await k8sCoreApi.deleteNamespacedService(clusterName + "-replicas", namespace);
        // console.log("Service " + clusterName + "-replicas deleted...");

        var pvcName = "redis-data-" + clusterName + "-replicas-0";
        await k8sCoreApi.deleteNamespacedPersistentVolumeClaim(pvcName, namespace);
        // console.log("PersistentVolumeClaim " + pvcName + " deleted...");
    } catch {
        // console.log("This has no read replicas...");
    }

    return "success!";
}

export async function restartRedis(clusterName) {
    try {
        var resourceName = clusterName + "-master";
        const sts = await k8sApi.readNamespacedStatefulSet(resourceName, namespace);

        // Increment the revision in the deployment template to trigger a rollout
        sts.body.spec.template.metadata.annotations = {
            ...sts.body.spec.template.metadata.annotations,
            "kubectl.kubernetes.io/restartedAt": new Date().toISOString(),
        };

        await k8sApi.replaceNamespacedStatefulSet(resourceName, namespace, sts.body);
        // console.log(`Rollout restart ${resourceName} initiated successfully.`);
    } catch (error) {
        console.error("Error restarting resource:", error.body);
        throw new AgnostError(error.body?.message);
    }

    // check if it has read replicas
    try {
        var resourceName = clusterName + "-replicas";
        const sts = await k8sApi.readNamespacedStatefulSet(resourceName, namespace);

        // Increment the revision in the deployment template to trigger a rollout
        sts.body.spec.template.metadata.annotations = {
            ...sts.body.spec.template.metadata.annotations,
            "kubectl.kubernetes.io/restartedAt": new Date().toISOString(),
        };

        try {
            await k8sApi.replaceNamespacedStatefulSet(resourceName, namespace, sts.body);
            // console.log(`Rollout restart ${resourceName} initiated successfully.`);
        } catch (error) {
            console.error("Error restarting resource:", error.body);
            throw new AgnostError(error.body?.message);
        }
    } catch (error) {
        console.log("No read replicas to restart...");
    }
}
