import { VersionParams } from '@/types/version.ts';
import { BaseGetRequest, BaseParams, BaseRequest, Log } from './type';

export enum EnvironmentStatus {
	OK = 'OK',
	Error = 'Error',
	Deploying = 'Deploying',
	Redeploying = 'Redeploying',
	Deleting = 'Deleting',
	Suspended = 'Suspended',
	Idle = 'Idle',
	Updating = 'Updating',
}
export interface Environment {
	orgId: string;
	appId: string;
	versionId: string;
	iid: string;
	name: string;
	autoDeploy: boolean;
	suspended: boolean;
	mappings: Mapping[];
	deploymentDtm: string;
	dbStatus: EnvironmentStatus;
	serverStatus: EnvironmentStatus;
	schedulerStatus: EnvironmentStatus;
	createdBy: string;
	updatedBy: string;
	_id: string;
	createdAt: string;
	updatedAt: string;
	__v: number;
}

interface Mapping {
	design: Design;
	resource: EnvironmentResource;
	_id: string;
	createdAt: string;
	updatedAt: string;
}

interface Design {
	iid: string;
	type: string;
	name: string;
}

interface EnvironmentResource {
	iid: string;
	name: string;
	type: string;
	instance: string;
}

export interface EnvLogDetail {
	startedAt: string;
	status: EnvironmentStatus;
	message: string;
	pod?: string;
	_id: string;
}
export interface EnvLog {
	orgId: string;
	appId: string;
	versionId: string;
	envId: string;
	action: string;
	dbStatus: EnvironmentStatus;
	serverStatus: EnvironmentStatus;
	schedulerStatus: EnvironmentStatus;
	dbLogs?: EnvLogDetail[];
	serverLogs?: EnvLogDetail[];
	schedulerLogs?: EnvLogDetail[];
	createdBy: string;
	_id: string;
	createdAt: string;
	updatedAt: string;
	description: string;
	serverStatusOK: number;
	serverStatusError: number;
}

export interface SelectedEnvLog {
	dbLogs: Log[];
	serverLogs: Log[];
	schedulerLogs: Log[];
}

export type UpdateEnvironmentTelemetryLogsParams = VersionParams & {
	logId: string;
};

export type ToggleAutoDeployParams = VersionParams & {
	autoDeploy: boolean;
};

export type GetEnvironmentLogsParams = VersionParams & {
	actor?: string;
	status?: string;
	logId?: string;
} & BaseGetRequest;
export type GetEnvironmentLogDetailsParams = VersionParams & {
	logId: string;
};

export type getAppVersionEnvironmentParams = BaseParams;
export type GetEnvironmentResourcesParams = VersionParams;
export interface UpdateAPIServerConfParams extends VersionParams, BaseRequest {
	minScale: number;
	maxScale: number;
	scaleDownDelay: string;
	scaleToZeroPodRetentionPeriod: string;
	cpu: {
		request: string;
		limit: string;
	};
	memory: {
		request: string;
		limit: string;
	};
}
