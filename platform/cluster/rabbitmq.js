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

const group = "rabbitmq.com";
const version = "v1beta1";
const namespace = process.env.NAMESPACE;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createRabbitmqCluster(clusterName, rmqVersion, size, userName, passwd, replicaCount) {
    const manifest = fs.readFileSync(`${__dirname}/manifests/rabbitmq-cluster.yaml`, "utf8");
    const resources = k8s.loadAllYaml(manifest);

    for (const resource of resources) {
        try {
            const { kind } = resource;
            var namespace = process.env.NAMESPACE;

            switch (kind) {
                case "Secret":
                    resource.metadata.name = clusterName + "-credentials";
                    resource.stringData.username = userName;
                    resource.stringData.password = passwd;
                    resource.stringData.host = clusterName + "." + namespace + ".svc";
                    k8sCoreApi.createNamespacedSecret(namespace, resource);
                    break;
                case "User":
                    resource.metadata.name = clusterName + "-" + userName;
                    resource.spec.rabbitmqClusterReference.name = clusterName;
                    resource.spec.importCredentialsSecret.name = clusterName + "-credentials";
                    await k8sCustomApi.createNamespacedCustomObject(group, version, namespace, "users", resource);
                    break;
                case "Permission":
                    resource.metadata.name = clusterName + "-" + userName + "-permission";
                    resource.spec.userReference.name = clusterName + "-" + userName;
                    resource.spec.rabbitmqClusterReference.name = clusterName;
                    await k8sCustomApi.createNamespacedCustomObject(group, version, namespace, "permissions", resource);
                    break;
                case "RabbitmqCluster":
                    resource.metadata.name = clusterName;
                    resource.spec.image = "docker.io/bitnami/rabbitmq:" + rmqVersion;
                    resource.spec.replicas = replicaCount;
                    resource.spec.persistence.storage = size;
                    resource.spec.override.statefulSet.spec.template.spec.initContainers[0].env[0].value = rmqVersion;
                    await k8sCustomApi.createNamespacedCustomObject(
                        group,
                        version,
                        namespace,
                        "rabbitmqclusters",
                        resource
                    );
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

export async function updateRabbitmqCluster(clusterName, rmqVersion, size, replicaCount) {
    try {
        const rmq = await k8sCustomApi.getNamespacedCustomObject(
            group,
            version,
            namespace,
            "rabbitmqclusters",
            clusterName
        );

        rmq.body.spec.image = "docker.io/bitnami/rabbitmq:" + rmqVersion;
        rmq.body.spec.replicas = replicaCount;
        rmq.body.spec.persistence.storage = size;
        if (
            rmq.body.spec.override.statefulSet.spec.template.spec.initContainers[0].env &&
            rmq.body.spec.override.statefulSet.spec.template.spec.initContainers[0].env[0]
        )
            rmq.body.spec.override.statefulSet.spec.template.spec.initContainers[0].env[0].value = rmqVersion;
        else
            rmq.body.spec.override.statefulSet.spec.template.spec.initContainers[0].env = [
                { name: "RMQ_VERSION", value: rmqVersion },
            ];

        await k8sCustomApi.replaceNamespacedCustomObject(
            group,
            version,
            namespace,
            "rabbitmqclusters",
            clusterName,
            rmq.body
        );
        // console.log("RabbitMQ " + clusterName + " updated...");
    } catch (error) {
        // console.error("Error updating RabbitMQ " + clusterName + " resources...", error);
        throw new AgnostError(error.body?.message);
    }

    return "success";
}

export async function deleteRabbitmqCluster(clusterName, userName) {
    try {
        try {
            await k8sCustomApi.deleteNamespacedCustomObject(
                group,
                version,
                namespace,
                "permissions",
                clusterName + "-" + userName + "-permission"
            );
            // console.log("Permission " + clusterName + "-" + userName + "-permission deleted...");
        } catch (err) {}
        try {
            await k8sCustomApi.deleteNamespacedCustomObject(
                group,
                version,
                namespace,
                "users",
                clusterName + "-" + userName
            );
            // console.log("User " + clusterName + "-" + userName + " deleted...");
        } catch (err) {}
        try {
            await k8sCustomApi.deleteNamespacedCustomObject(group, version, namespace, "rabbitmqclusters", clusterName);
            // console.log("Cluster " + clusterName + " deleted...");
        } catch (err) {}
        try {
            await k8sCoreApi.deleteNamespacedSecret(clusterName + "-credentials", namespace);
            // console.log("Secret " + clusterName + "-credentials deleted...");
        } catch (err) {}
    } catch (error) {
        // console.error("Error deleting resource:", error.body?.message);
        throw new AgnostError(error.body?.message);
    }

    return "success";
}

export async function restartRabbitMQ(resourceName) {
    try {
        const sts = await k8sAppsApi.readNamespacedStatefulSet(resourceName + "-server", namespace);

        // Increment the revision in the deployment template to trigger a rollout
        sts.body.spec.template.metadata.annotations = {
            ...sts.body.spec.template.metadata.annotations,
            "kubectl.kubernetes.io/restartedAt": new Date().toISOString(),
        };

        await k8sAppsApi.replaceNamespacedStatefulSet(resourceName + "-server", namespace, sts.body);
        console.log(`Rollout restart ${resourceName} initiated successfully.`);
    } catch (error) {
        console.error("Error restarting resource:", error.body);
        throw new AgnostError(error.body?.message);
    }
}
