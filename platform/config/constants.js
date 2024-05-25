// Types of login providers supported. Initially we support github,
// later on we can support "bitbucket", "gitlab" etc.
export const providerTypes = ["github"];

// Notification types
export const notificationTypes = ["org", "project", "environment", "container"];

// User statuses
export const userStatus = ["Active", "Deleted"];

// Organization roles
export const orgRoles = ["Admin", "Member"];
export const orgRoleDesc = {
	Admin: t(
		"Full control over the organization. Can manage organization properties, organization team and can create new projects and organizations."
	),
	Member: t(
		"Can view organization and its members but cannot update them and cannot create new projects and organizations."
	),
};

// Project team member roles
export const projectRoles = ["Admin", "Developer", "Viewer"];
export const projectRoleDesc = {
	Admin: t(
		"Full control over the project, its environments, containers and team members. Can manage all project environments even the ones marked as private or read-only."
	),
	Developer: t(
		"Has read-write access over the containers of his project environment. Can view environments marked as public by other project members but cannot manage project team and edit read-only environments."
	),
	Viewer: t(
		"Read-only access to public project environments and project properties."
	),
};

// Types of Docker image registries supported
export const registryTypes = [
	"ECR", // Amazon Elastic Container Registry
	"ACR", // Azure Container Registry
	"GCR", // Google Container Registry
	"GAR", // Google Artifact Registry
	"Quay", // Quay.io
	"GHCR", // GitHub Container Registry
	"Docker Public", // Docker Hub Public
	"Docker Private", // Docker Hub Private
	"Custom", // Generic registry
];

// Types of containers that can be created in an environment
export const containerTypes = [
	"deployment",
	"stateful set",
	"cron job",
	"knative service",
];

// Invitation statuses
export const invitationStatus = ["Pending", "Accepted", "Rejected"];

export const cacheTypes = ["Redis"];

// List of components that can be customized in terms of min and max replicas
export const clusterComponents = [
	{
		deploymentName: "platform",
		hpaName: "platform-hpa",
	},
	{
		deploymentName: "sync",
		hpaName: "sync-hpa",
	},
	{
		deploymentName: "studio",
		hpaName: "studio-hpa",
	},
];

// List of resources that can be customized in terms of storage size
export const clusterResources = [
	{
		name: "mongodb",
		type: "database",
		instance: "MongoDB",
		k8sName: "mongodb",
	},
	{
		name: "redis-master",
		type: "cache",
		instance: "Redis",
		k8sName: "redis",
	},
	{
		name: "minio-storage",
		type: "storage",
		instance: "Minio",
		k8sName: "minio-storage",
	},
];

export const clusterComponentStatus = ["OK", "Error", "Updating"];

export const resourceVersions = {
	MongoDB: ["7.0.1", "6.0.11", "5.0.21", "4.4.25"],
	PostgreSQL: ["15", "14", "13", "12"],
	MySQL: ["8.1.0", "8.0.34"],
	RabbitMQ: ["3.12.6", "3.11.23"],
	Redis: ["7.2.1", "7.0.13", "6.2.13"],
};
