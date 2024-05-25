import k8s from "@kubernetes/client-node";

// Kubernetes client configuration
// Kubernetes client configuration
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sApi = kc.makeApiClient(k8s.AppsV1Api);

const namespace = process.env.NAMESPACE;

// Function to simulate sleep
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function scaleDeployment(deploymentName, replicas) {
    // find the particular deployment
    try {
        res = await k8sApi.readNamespacedDeployment(deploymentName, namespace);
        let deployment = res.body;

        // edit
        deployment.spec.replicas = replicas;

        // replace
        await k8sApi.replaceNamespacedDeployment(deploymentName, namespace, deployment);
    } catch (error) {
        throw new AgnostError(err.body?.message);
    }
}

async function scaleStatefulSet(statefulSetName, replicas) {
    // find the particular deployment
    try {
        res = await k8sApi.readNamespacedStatefulSet(statefulSetName, namespace);
        let sts = res.body;

        // edit
        sts.spec.replicas = replicas;

        // replace
        await k8sApi.replaceNamespacedStatefulSet(statefulSetName, namespace, sts);
    } catch (error) {
        throw new AgnostError(err.body?.message);
    }
}

export async function updateMinioStorageSize(clusterName, newSize) {
    const pvcPatch = {
        spec: {
            resources: {
                requests: {
                    storage: newSize,
                },
            },
        },
    };
    const requestOptions = { headers: { "Content-Type": "application/merge-patch+json" } };

    try {
        const pvcList = await k8sCoreApi.listNamespacedPersistentVolumeClaim(namespace);
        pvcList.body.items.forEach(async (pvc) => {
            var pvcName = pvc.metadata.name;
            if (pvcName.includes(clusterName)) {
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

        await sleep(500);

        // MinIO might be a Deployment or a StatefulSet
        let isDeployment = false;
        let deploymentName = clusterName;
        let replicas = 1;
        deploymentList = await k8sApi.listNamespacedDeployment(namespace);
        deploymentList.body.items.forEach(async (depl) => {
            var dname = depl.metadata.name;
            if (dname.includes(clusterName)) {
                isDeployment = true;
                deploymentName = dname;
                replicas = depl.spec.replicas;
            }
        });

        if (isDeployment) {
            await scaleDeployment(deploymentName, 0);
            await sleep(500);
            await scaleDeployment(deploymentName, replicas);
        } else {
            stsList = await k8sApi.listNamespacedStatefulSet(namespace);
            stsList.body.items.forEach(async (sts) => {
                var stsName = sts.metadata.name;
                if (stsName.includes(clusterName)) {
                    const replicas = sts.spec.replicas;
                    await scaleStatefulSet(stsName, 0);
                    await sleep(500);
                    await scaleStatefulSet(stsName, replicas);
                }
            });
        }

        return "success";
    } catch (error) {
        throw new AgnostError(err.body?.message);
    }
}
