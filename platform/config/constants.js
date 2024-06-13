// Types of login providers supported. Initially we support github,
// later on we can support "bitbucket", "gitlab" etc.
export const providerTypes = ["github", "gitlab"];

// Notification types
export const notificationTypes = ["org", "project", "environment", "container"];

// User statuses
export const userStatus = ["Active", "Deleted"];

// Organization roles
export const orgRoles = ["Admin", "Member"];
export const orgRoleDesc = {
	Admin:
		"Full control over the organization. Can manage organization properties, organization team and can create new projects and organizations.",
	Member:
		"Can view organization and its members but cannot update them and cannot create new projects and organizations.",
};

// Project team member roles
export const projectRoles = ["Admin", "Developer", "Viewer"];
export const projectRoleDesc = {
	Admin:
		"Full control over the project, its environments, containers and team members. Can manage all project environments even the ones marked as private or read-only.",
	Developer:
		"Has read-write access over the containers of his project environment. Can view environments marked as public by other project members but cannot manage project team and edit read-only environments.",
	Viewer:
		"Read-only access to public project environments and project properties.",
};

// Types of Docker image registries supported
export const registryTypes = [
	"ECR", // Amazon Elastic Container Registry
	"ACR", // Azure Container Registry
	"GCR", // Google Container Registry
	"GAR", // Google Artifact Registry
	"Quay", // Quay.io
	"GHCR", // GitHub Container Registry
	"Docker", // Docker Hub Private
	"Custom", // Generic registry
	"Public", // Any public image registry
];

// Types of containers that can be created in an environment
export const containerTypes = ["deployment", "statefulset", "cronjob"];

// Invitation statuses
export const invitationStatus = ["Pending", "Accepted", "Rejected"];
