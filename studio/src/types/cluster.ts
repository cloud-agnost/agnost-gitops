import { Application } from './application';
import { Environment } from './environment';
import { Organization } from './organization';
import { BaseRequest } from './type';
import { Version } from './version';

export type ClusterComponentsType =
	| 'Node.js'
	| 'React'
	| 'MongoDB'
	| 'RabbitMQ'
	| 'Redis'
	| 'MinIO';
export type ClusterK8sType = 'Deployment' | 'StatefulSet';

export interface ClusterComponent {
	name: string;
	hpaName: string;
	deploymentName: string;
	title: string;
	hasHpa: boolean;
	editable: boolean;
	type: ClusterComponentsType;
	k8sType: ClusterK8sType;
	description: string;
	info: {
		version: string;
		configuredReplicas: number;
		runningReplicas: number;
		minReplicas: number;
		maxReplicas: number;
		pvcSize?: string;
	};
}

export interface UpdateClusterComponentParams extends BaseRequest {
	hpaName: string;
	deploymentName: string;
	replicas: number;
	minReplicas: number;
	maxReplicas: number;
}

export interface ClusterSetupResponse {
	org: Organization;
	app: Application;
	version: Version;
	env: Environment;
}

export interface ModuleVersions {
	'engine-core': string;
	'engine-monitor': string;
	'engine-realtime': string;
	'engine-scheduler': string;
	'engine-worker': string;
	'platform-core': string;
	'platform-sync': string;
	'platform-worker': string;
	studio: string;
}

interface ReleaseInfo {
	release: string;
	modules: ModuleVersions;
}

export interface ClusterReleaseHistory {
	release: string;
	timestamp: string;
	_id: string;
}

export interface ClusterResourceStatus {
	name: string;
	status: string;
	_id: string;
	lastUpdateAt: string;
}

export interface Cluster {
	_id: string;
	clusterAccesssToken: string;
	masterToken: string;
	accessToken: string;
	release: string;
	releaseHistory: ClusterReleaseHistory[];
	createdBy: string;
	domains: string[];
	enforceSSLAccess: boolean;
	ips: string[];
	clusterResourceStatus: ClusterResourceStatus[];
	createdAt: string;
	updatedAt: string;
	cicdEnabled: boolean;
	smtp: {
		fromEmail: string;
		fromName: string;
		host: string;
		port: number;
		user: string;
		password: string;
		useTLS: boolean;
	};
}

export interface ClusterReleaseInfo {
	current: {
		release: string;
		modules: ModuleVersions;
	};
	latest: ReleaseInfo;
	cluster: Cluster;
}
export interface ClusterComponentReleaseInfo {
	module: string;
	version: string;
	status: string;
	latest: string;
}

export type DomainParams = {
	domain: string;
};

export type EnforceSSLAccessParams = {
	enforceSSLAccess: boolean;
};

export interface UpdateRemainingClusterComponentsParams {
	componentName: string;
	updateType: string;
	config: {
		size: string;
		replicas: number;
		version: string;
		readReplica: boolean;
	};
}
