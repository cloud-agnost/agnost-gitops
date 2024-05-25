export const clusterComponents = [
    {
        deploymentName: "engine-worker-deployment",
        hpaName: "engine-worker-hpa",
        title: "Engine Worker",
        hasHpa: true,
        editable: true,
        type: "Node.js",
        k8sType: "Deployment",
        description: t(
            "Handles the deployment of the application design to the databases, API servers, and cron job scheduler."
        ),
    },
    {
        deploymentName: "engine-monitor-deployment",
        title: "Engine Monitor",
        hasHpa: false,
        editable: false,
        type: "Node.js",
        k8sType: "Deployment",
        description: t(
            "Monitors and checks the health of all Agnost cluster resources, including the ones created within the cluster and the externally linked ones."
        ),
    },
    {
        deploymentName: "engine-realtime-deployment",
        hpaName: "engine-realtime-hpa",
        title: "Engine Realtime",
        hasHpa: true,
        editable: true,
        type: "Node.js",
        k8sType: "Deployment",
        description: t("Socket.io server of the apps that utilize realtime features of the cluster."),
    },
    {
        deploymentName: "engine-scheduler-deployment",
        title: "Engine Scheduler",
        hasHpa: false,
        editable: false,
        type: "Node.js",
        k8sType: "Deployment",
        description: t("Manages the cron jobs defined in application versions."),
    },
    {
        deploymentName: "platform-core-deployment",
        hpaName: "platform-core-hpa",
        title: "Platform Core",
        hasHpa: true,
        editable: true,
        type: "Node.js",
        k8sType: "Deployment",
        description: t(
            "The API server of the cluster. It handles cluster user registration, organization, app, and version creation, and for each version, management of data models, endpoints, cron jobs, message queues, and storage etc."
        ),
    },
    {
        deploymentName: "platform-sync-deployment",
        hpaName: "platform-sync-hpa",
        title: "Platform Sync",
        hasHpa: true,
        editable: true,
        type: "Node.js",
        k8sType: "Deployment",
        description: t(
            "Socket.io realtime server of the platform. It is primarily used to send realtime messages about design and code changes of developed applications."
        ),
    },
    {
        deploymentName: "platform-worker-deployment",
        hpaName: "platform-worker-hpa",
        title: "Platform Worker",
        hasHpa: true,
        editable: true,
        type: "Node.js",
        k8sType: "Deployment",
        description: t("Performs asynchronous tasks on behalf of the Platform Core."),
    },
    {
        deploymentName: "studio-deployment",
        hpaName: "studio-hpa",
        title: "Studio",
        hasHpa: true,
        editable: true,
        type: "React",
        k8sType: "Deployment",
        description: t(
            "Platform's front-end to manage settings, resources, and users of the cluster and create and deploy new applications."
        ),
    },
    {
        statefulSetName: "mongodb",
        name: "mongodb",
        title: "Platform Database",
        hasHpa: false,
        editable: true,
        type: "MongoDB",
        k8sType: "StatefulSet",
        hasPVC: true,
        PVCName: "data-volume-mongodb-0",
        description: t(
            "Store all data about application versions, design specifications, endpoint code, etc., and used as the single source of truth."
        ),
    },
    {
        statefulSetName: "rabbitmq-server",
        name: "rabbitmq-server",
        title: "Platform Message Broker",
        hasHpa: false,
        editable: true,
        type: "RabbitMQ",
        k8sType: "StatefulSet",
        hasPVC: true,
        PVCName: "persistence-rabbitmq-server-0",
        description: t(
            "Manages the asynchronous task queues to perform data model deployments and application code push to API servers."
        ),
    },
    {
        statefulSetName: "redis-master",
        name: "redis-master",
        title: "Platform Cache",
        hasHpa: false,
        editable: true,
        type: "Redis",
        k8sType: "StatefulSet",
        hasPVC: true,
        PVCName: "redis-data-redis-master-0",
        description: t("Caches a subset of MongoDB data to speed up application design data retrieval."),
    },
    {
        statefulSetName: "minio-storage",
        name: "minio-storage",
        title: "Platform Storage",
        hasHpa: false,
        editable: true,
        type: "MinIO",
        k8sType: "StatefulSet",
        hasPVC: true,
        PVCName: "minio-storage",
        description: t(
            "Handles the document storage needs of the Agnost platform itself and the storage needs of the developed applications."
        ),
    },
    {
        deploymentName: "minio-storage",
        name: "minio-storage",
        title: "Platform Storage",
        hasHpa: false,
        editable: true,
        type: "MinIO",
        k8sType: "Deployment",
        hasPVC: true,
        PVCName: "minio-storage",
        description: t(
            "Handles the document storage needs of the Agnost platform itself and the storage needs of the developed applications."
        ),
    },
    {
        deploymentName: "minio",
        name: "minio",
        title: "Platform Storage",
        hasHpa: false,
        editable: true,
        type: "MinIO",
        k8sType: "Deployment",
        hasPVC: true,
        PVCName: "minio",
        description: t(
            "Handles the document storage needs of the Agnost platform itself and the storage needs of the developed applications."
        ),
    },
];
