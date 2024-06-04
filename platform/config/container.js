export const clusterContainers = [
	{
		iid: "platform",
		name: "platform",
		type: "deployment",
		pipelineStatus: "Disconnected",
		variables: [
			{ name: "CACHE_HOSTNAME", value: process.env.CACHE_HOSTNAME },
			{ name: "CACHE_PWD", value: process.env.CACHE_PWD },
			{ name: "CLUSTER_DB_URI", value: process.env.CLUSTER_DB_URI },
			{ name: "CLUSTER_DB_USER", value: process.env.CLUSTER_DB_USER },
			{ name: "CLUSTER_DB_PWD", value: process.env.CLUSTER_DB_PWD },
			{ name: "PASSPHRASE", value: process.env.PASSPHRASE },
			{ name: "CLUSTER_ACCESS_TOKEN", value: process.env.CLUSTER_ACCESS_TOKEN },
			{ name: "MASTER_TOKEN", value: process.env.MASTER_TOKEN },
			{ name: "MINIO_ENDPOINT", value: process.env.MINIO_ENDPOINT },
			{ name: "MINIO_PORT", value: process.env.MINIO_PORT },
			{ name: "MINIO_ACCESS_KEY", value: process.env.MINIO_ACCESS_KEY },
			{ name: "MINIO_SECRET_KEY", value: process.env.MINIO_SECRET_KEY },
			{ name: "NAMESPACE", value: process.env.NAMESPACE },
			{ name: "RELEASE_NUMBER", value: process.env.RELEASE_NUMBER },
		],
		repoOrRegistry: "registry",
		registry: {
			imageName: "cloudagnost/platform",
			imageTag: "1.0.0",
		},
		networking: {
			containerPort: 4000,
			ingress: {
				enabled: true,
				name: "api",
			},
			customDomain: {
				enabled: false,
			},
			tcpProxy: {
				enabled: false,
			},
		},
		podConfig: {
			restartPolicy: "Always",
			cpuRequest: 100,
			cpuRequestType: "millicores",
			cpuLimit: 1,
			cpuLimitType: "cores",
			memoryRequest: 128,
			memoryRequestType: "mebibyte",
			memoryLimit: 1,
			memoryLimitType: "gibibyte",
		},
		storageConfig: {
			enabled: false,
			size: 1,
			sizeType: "gibibyte",
			accessModes: ["ReadWriteOnce"],
		},
		deploymentConfig: {
			desiredReplicas: 1,
			minReplicas: 1,
			maxReplicas: 5,
			cpuMetric: {
				enabled: true,
				metricType: "AverageUtilization",
				metricValue: 80,
			},
			memoryMetric: {
				enabled: true,
				metricType: "AverageValueMebibyte",
				metricValue: 100,
			},
			strategy: "RollingUpdate",
			rollingUpdate: {
				maxSurge: 30,
				maxSurgeType: "percentage",
				maxUnavailable: 0,
				maxUnavailableType: "number",
			},
			revisionHistoryLimit: 10,
		},
		probes: {
			startup: {
				enabled: true,
				checkMechanism: "httpGet",
				httpPath: "/health",
				httpPort: 4000,
				initialDelaySeconds: 10,
				periodSeconds: 30,
				timeoutSeconds: 5,
				failureThreshold: 30,
			},
			readiness: {
				enabled: false,
				checkMechanism: "httpGet",
				httpPath: "/health",
				httpPort: 4000,
				initialDelaySeconds: 10,
				periodSeconds: 30,
				timeoutSeconds: 5,
				failureThreshold: 3,
			},
			liveness: {
				enabled: true,
				checkMechanism: "httpGet",
				httpPath: "/health",
				httpPort: 4000,
				initialDelaySeconds: 10,
				periodSeconds: 30,
				timeoutSeconds: 5,
				failureThreshold: 3,
			},
		},
	},
	{
		iid: "sync",
		name: "sync",
		type: "deployment",
		pipelineStatus: "Disconnected",
		variables: [
			{ name: "CACHE_HOSTNAME", value: process.env.CACHE_HOSTNAME },
			{ name: "CACHE_PWD", value: process.env.CACHE_PWD },
			{ name: "NAMESPACE", value: process.env.NAMESPACE },
			{ name: "RELEASE_NUMBER", value: process.env.RELEASE_NUMBER },
		],
		repoOrRegistry: "registry",
		registry: {
			imageName: "cloudagnost/sync",
			imageTag: "1.0.0",
		},
		networking: {
			containerPort: 4000,
			ingress: {
				enabled: true,
				name: "sync",
			},
			customDomain: {
				enabled: false,
			},
			tcpProxy: {
				enabled: false,
			},
		},
		podConfig: {
			restartPolicy: "Always",
			cpuRequest: 100,
			cpuRequestType: "millicores",
			cpuLimit: 1,
			cpuLimitType: "cores",
			memoryRequest: 128,
			memoryRequestType: "mebibyte",
			memoryLimit: 1,
			memoryLimitType: "gibibyte",
		},
		storageConfig: {
			enabled: false,
			size: 1,
			sizeType: "gibibyte",
			accessModes: ["ReadWriteOnce"],
		},
		deploymentConfig: {
			desiredReplicas: 1,
			minReplicas: 1,
			maxReplicas: 5,
			cpuMetric: {
				enabled: true,
				metricType: "AverageUtilization",
				metricValue: 80,
			},
			memoryMetric: {
				enabled: true,
				metricType: "AverageValueMebibyte",
				metricValue: 100,
			},
			strategy: "RollingUpdate",
			rollingUpdate: {
				maxSurge: 30,
				maxSurgeType: "percentage",
				maxUnavailable: 0,
				maxUnavailableType: "number",
			},
			revisionHistoryLimit: 10,
		},
		probes: {
			startup: {
				enabled: true,
				checkMechanism: "httpGet",
				httpPath: "/health",
				httpPort: 4000,
				initialDelaySeconds: 10,
				periodSeconds: 30,
				timeoutSeconds: 5,
				failureThreshold: 30,
			},
			readiness: {
				enabled: false,
				checkMechanism: "httpGet",
				httpPath: "/health",
				httpPort: 4000,
				initialDelaySeconds: 10,
				periodSeconds: 30,
				timeoutSeconds: 5,
				failureThreshold: 3,
			},
			liveness: {
				enabled: true,
				checkMechanism: "httpGet",
				httpPath: "/health",
				httpPort: 4000,
				initialDelaySeconds: 10,
				periodSeconds: 30,
				timeoutSeconds: 5,
				failureThreshold: 3,
			},
		},
	},
	{
		iid: "studio",
		name: "studio",
		type: "deployment",
		pipelineStatus: "Disconnected",
		variables: [
			{ name: "NAMESPACE", value: process.env.NAMESPACE },
			{ name: "RELEASE_NUMBER", value: process.env.RELEASE_NUMBER },
		],
		repoOrRegistry: "registry",
		registry: {
			imageName: "cloudagnost/studio",
			imageTag: "1.0.0",
		},
		networking: {
			containerPort: 4000,
			ingress: {
				enabled: true,
				name: "studio",
			},
			customDomain: {
				enabled: false,
			},
			tcpProxy: {
				enabled: false,
			},
		},
		podConfig: {
			restartPolicy: "Always",
			cpuRequest: 100,
			cpuRequestType: "millicores",
			cpuLimit: 1,
			cpuLimitType: "cores",
			memoryRequest: 128,
			memoryRequestType: "mebibyte",
			memoryLimit: 256,
			memoryLimitType: "mebibyte",
		},
		storageConfig: {
			enabled: false,
			size: 1,
			sizeType: "gibibyte",
			accessModes: ["ReadWriteOnce"],
		},
		deploymentConfig: {
			desiredReplicas: 1,
			minReplicas: 1,
			maxReplicas: 5,
			cpuMetric: {
				enabled: true,
				metricType: "AverageUtilization",
				metricValue: 80,
			},
			memoryMetric: {
				enabled: true,
				metricType: "AverageValueMebibyte",
				metricValue: 100,
			},
			strategy: "RollingUpdate",
			rollingUpdate: {
				maxSurge: 30,
				maxSurgeType: "percentage",
				maxUnavailable: 0,
				maxUnavailableType: "number",
			},
			revisionHistoryLimit: 10,
		},
		probes: {
			startup: {
				enabled: false,
				checkMechanism: "httpGet",
				httpPath: "/health",
				httpPort: 4000,
				initialDelaySeconds: 10,
				periodSeconds: 30,
				timeoutSeconds: 5,
				failureThreshold: 30,
			},
			readiness: {
				enabled: false,
				checkMechanism: "httpGet",
				httpPath: "/health",
				httpPort: 4000,
				initialDelaySeconds: 10,
				periodSeconds: 30,
				timeoutSeconds: 5,
				failureThreshold: 3,
			},
			liveness: {
				enabled: false,
				checkMechanism: "httpGet",
				httpPath: "/health",
				httpPort: 4000,
				initialDelaySeconds: 10,
				periodSeconds: 30,
				timeoutSeconds: 5,
				failureThreshold: 3,
			},
		},
	},
	{
		iid: "monitor",
		name: "monitor",
		type: "deployment",
		pipelineStatus: "Disconnected",
		variables: [
			{ name: "CLUSTER_DB_URI", value: process.env.CLUSTER_DB_URI },
			{ name: "CLUSTER_DB_USER", value: process.env.CLUSTER_DB_USER },
			{ name: "CLUSTER_DB_PWD", value: process.env.CLUSTER_DB_PWD },
			{ name: "PASSPHRASE", value: process.env.PASSPHRASE },
			{ name: "MASTER_TOKEN", value: process.env.MASTER_TOKEN },
			{ name: "NAMESPACE", value: process.env.NAMESPACE },
			{ name: "RELEASE_NUMBER", value: process.env.RELEASE_NUMBER },
		],
		repoOrRegistry: "registry",
		registry: {
			imageName: "cloudagnost/monitor",
			imageTag: "1.0.0",
		},
		networking: {
			containerPort: 4000,
			ingress: {
				enabled: false,
			},
			customDomain: {
				enabled: false,
			},
			tcpProxy: {
				enabled: false,
			},
		},
		podConfig: {
			restartPolicy: "Always",
			cpuRequest: 100,
			cpuRequestType: "millicores",
			cpuLimit: 1,
			cpuLimitType: "cores",
			memoryRequest: 128,
			memoryRequestType: "mebibyte",
			memoryLimit: 256,
			memoryLimitType: "mebibyte",
		},
		storageConfig: {
			enabled: false,
			size: 1,
			sizeType: "gibibyte",
			accessModes: ["ReadWriteOnce"],
		},
		deploymentConfig: {
			desiredReplicas: 1,
			minReplicas: 1,
			maxReplicas: 1,
			cpuMetric: {
				enabled: false,
				metricType: "AverageUtilization",
				metricValue: 80,
			},
			memoryMetric: {
				enabled: false,
				metricType: "AverageValueMebibyte",
				metricValue: 100,
			},
			strategy: "RollingUpdate",
			rollingUpdate: {
				maxSurge: 30,
				maxSurgeType: "percentage",
				maxUnavailable: 0,
				maxUnavailableType: "number",
			},
			revisionHistoryLimit: 10,
		},
		probes: {
			startup: {
				enabled: true,
				checkMechanism: "httpGet",
				httpPath: "/health",
				httpPort: 4000,
				initialDelaySeconds: 10,
				periodSeconds: 30,
				timeoutSeconds: 5,
				failureThreshold: 30,
			},
			readiness: {
				enabled: false,
				checkMechanism: "httpGet",
				httpPath: "/health",
				httpPort: 4000,
				initialDelaySeconds: 10,
				periodSeconds: 30,
				timeoutSeconds: 5,
				failureThreshold: 3,
			},
			liveness: {
				enabled: false,
				checkMechanism: "httpGet",
				httpPath: "/health",
				httpPort: 4000,
				initialDelaySeconds: 10,
				periodSeconds: 30,
				timeoutSeconds: 5,
				failureThreshold: 3,
			},
		},
	},
	{
		iid: "minio",
		name: "minio",
		type: "deployment",
		pipelineStatus: "Disconnected",
		variables: [
			{ name: "MINIO_ROOT_USER", value: process.env.MINIO_ACCESS_KEY },
			{ name: "MINIO_ROOT_PASSWORD", value: process.env.MINIO_SECRET_KEY },
			{ name: "MINIO_PROMETHEUS_AUTH_TYPE", value: "public" },
		],
		repoOrRegistry: "registry",
		registry: {
			imageName: "quay.io/minio/minio",
			imageTag: "RELEASE.2024-01-11T07-46-16Z",
		},
		networking: {
			containerPort: 9000,
			ingress: {
				enabled: false,
			},
			customDomain: {
				enabled: false,
			},
			tcpProxy: {
				enabled: false,
			},
		},
		podConfig: {
			restartPolicy: "Always",
			cpuRequest: 100,
			cpuRequestType: "millicores",
			cpuLimit: 1,
			cpuLimitType: "cores",
			memoryRequest: 256,
			memoryRequestType: "mebibyte",
			memoryLimit: 1,
			memoryLimitType: "gibibyte",
		},
		storageConfig: {
			enabled: true,
			mountPath: "/export",
			size: 10,
			sizeType: "gibibyte",
			accessModes: ["ReadWriteOnce"],
		},
		deploymentConfig: {
			desiredReplicas: 1,
			minReplicas: 1,
			maxReplicas: 1,
			cpuMetric: {
				enabled: false,
				metricType: "AverageUtilization",
				metricValue: 80,
			},
			memoryMetric: {
				enabled: false,
				metricType: "AverageValueMebibyte",
				metricValue: 100,
			},
			strategy: "RollingUpdate",
			rollingUpdate: {
				maxSurge: 100,
				maxSurgeType: "percentage",
				maxUnavailable: 0,
				maxUnavailableType: "number",
			},
			revisionHistoryLimit: 10,
		},
		probes: {
			startup: {
				enabled: false,
				checkMechanism: "httpGet",
				httpPath: "/health",
				httpPort: 4000,
				initialDelaySeconds: 10,
				periodSeconds: 30,
				timeoutSeconds: 5,
				failureThreshold: 30,
			},
			readiness: {
				enabled: false,
				checkMechanism: "httpGet",
				httpPath: "/health",
				httpPort: 4000,
				initialDelaySeconds: 10,
				periodSeconds: 30,
				timeoutSeconds: 5,
				failureThreshold: 3,
			},
			liveness: {
				enabled: false,
				checkMechanism: "httpGet",
				httpPath: "/health",
				httpPort: 4000,
				initialDelaySeconds: 10,
				periodSeconds: 30,
				timeoutSeconds: 5,
				failureThreshold: 3,
			},
		},
	},
	{
		iid: "redis",
		name: "redis",
		type: "statefulset",
		pipelineStatus: "Disconnected",
		variables: [
			{ name: "BITNAMI_DEBUG", value: "false" },
			{ name: "REDIS_REPLICATION_MODE", value: "master" },
			{ name: "ALLOW_EMPTY_PASSWORD", value: "no" },
			{ name: "REDIS_PASSWORD", value: process.env.CACHE_PWD },
			{ name: "REDIS_TLS_ENABLED", value: "no" },
			{ name: "REDIS_PORT", value: "6379" },
		],
		repoOrRegistry: "registry",
		registry: {
			imageName: "docker.io/bitnami/redis",
			imageTag: "7.0.11-debian-11-r0",
		},
		networking: {
			containerPort: 6379,
			ingress: {
				enabled: false,
			},
			customDomain: {
				enabled: false,
			},
			tcpProxy: {
				enabled: false,
			},
		},
		podConfig: {
			restartPolicy: "Always",
			cpuRequest: 100,
			cpuRequestType: "millicores",
			cpuLimit: 1,
			cpuLimitType: "cores",
			memoryRequest: 512,
			memoryRequestType: "mebibyte",
			memoryLimit: 1,
			memoryLimitType: "gibibyte",
		},
		storageConfig: {
			enabled: true,
			mountPath: "/data",
			size: 512,
			sizeType: "mebibyte",
			accessModes: ["ReadWriteOnce"],
		},
		statefulSetConfig: {
			desiredReplicas: 1,
			strategy: "RollingUpdate",
			rollingUpdate: {
				maxSurge: 100,
				maxSurgeType: "percentage",
				maxUnavailable: 0,
				maxUnavailableType: "number",
			},
			revisionHistoryLimit: 10,
			podManagementPolicy: "OrderedReady",
			persistentVolumeClaimRetentionPolicy: {
				whenDeleted: "Retain",
				whenScaled: "Retain",
			},
		},
		probes: {
			startup: {
				enabled: false,
				checkMechanism: "httpGet",
				httpPath: "/health",
				httpPort: 4000,
				initialDelaySeconds: 10,
				periodSeconds: 30,
				timeoutSeconds: 5,
				failureThreshold: 30,
			},
			readiness: {
				enabled: true,
				checkMechanism: "exec",
				execCommand: "sh -c /health/ping_readiness_local.sh 1",
				initialDelaySeconds: 20,
				periodSeconds: 5,
				timeoutSeconds: 2,
				failureThreshold: 5,
			},
			liveness: {
				enabled: false,
				checkMechanism: "httpGet",
				httpPath: "/health",
				httpPort: 4000,
				initialDelaySeconds: 10,
				periodSeconds: 30,
				timeoutSeconds: 5,
				failureThreshold: 3,
			},
		},
	},
	{
		iid: "mongodb",
		name: "mongodb",
		type: "statefulset",
		pipelineStatus: "Disconnected",
		variables: [],
		repoOrRegistry: "registry",
		registry: {
			imageName: "docker.io/mongo",
			imageTag: "6.0.11",
		},
		networking: {
			containerPort: 27017,
			ingress: {
				enabled: false,
			},
			customDomain: {
				enabled: false,
			},
			tcpProxy: {
				enabled: false,
			},
		},
		podConfig: {
			restartPolicy: "Always",
			cpuRequest: 100,
			cpuRequestType: "millicores",
			cpuLimit: 1,
			cpuLimitType: "cores",
			memoryRequest: 512,
			memoryRequestType: "mebibyte",
			memoryLimit: 2,
			memoryLimitType: "gibibyte",
		},
		storageConfig: {
			enabled: true,
			mountPath: "/data",
			size: 5,
			sizeType: "gibibyte",
			accessModes: ["ReadWriteOnce"],
		},
		statefulSetConfig: {
			desiredReplicas: 1,
			strategy: "RollingUpdate",
			rollingUpdate: {
				maxSurge: 100,
				maxSurgeType: "percentage",
				maxUnavailable: 0,
				maxUnavailableType: "number",
			},
			revisionHistoryLimit: 10,
			podManagementPolicy: "OrderedReady",
			persistentVolumeClaimRetentionPolicy: {
				whenDeleted: "Retain",
				whenScaled: "Retain",
			},
		},
		probes: {
			startup: {
				enabled: false,
				checkMechanism: "httpGet",
				httpPath: "/health",
				httpPort: 4000,
				initialDelaySeconds: 10,
				periodSeconds: 30,
				timeoutSeconds: 5,
				failureThreshold: 30,
			},
			readiness: {
				enabled: true,
				checkMechanism: "exec",
				execCommand: "opt/scripts/readinessprobe",
				initialDelaySeconds: 5,
				periodSeconds: 30,
				timeoutSeconds: 20,
				failureThreshold: 40,
			},
			liveness: {
				enabled: false,
				checkMechanism: "httpGet",
				httpPath: "/health",
				httpPort: 4000,
				initialDelaySeconds: 10,
				periodSeconds: 30,
				timeoutSeconds: 5,
				failureThreshold: 3,
			},
		},
	},
];
