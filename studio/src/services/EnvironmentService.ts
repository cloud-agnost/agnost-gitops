import { axios } from '@/helpers';
import {
	EnvLog,
	Environment,
	GetEnvironmentLogDetailsParams,
	GetEnvironmentLogsParams,
	GetEnvironmentResourcesParams,
	Resource,
	ToggleAutoDeployParams,
	UpdateAPIServerConfParams,
	UpdateEnvironmentTelemetryLogsParams,
	VersionParams,
	getAppVersionEnvironmentParams,
} from '@/types';

export default class EnvironmentService {
	static url = '/v1/org';

	static async getAppVersionEnvironment({
		orgId,
		appId,
		versionId,
	}: getAppVersionEnvironmentParams): Promise<Environment> {
		return (await axios.get(`${this.url}/${orgId}/app/${appId}/version/${versionId}/env`)).data;
	}

	static async getEnvironmentLogs({
		orgId,
		appId,
		versionId,
		envId,
		...params
	}: GetEnvironmentLogsParams) {
		return (
			await axios.get(`${this.url}/${orgId}/app/${appId}/version/${versionId}/env/${envId}/logs`, {
				params: params,
			})
		).data;
	}
	static async getEnvironmentLogsDetail({
		orgId,
		appId,
		versionId,
		envId,
		logId,
		...params
	}: GetEnvironmentLogDetailsParams): Promise<EnvLog> {
		return (
			await axios.get(
				`${this.url}/${orgId}/app/${appId}/version/${versionId}/env/${envId}/logs/${logId}`,
				{
					params: params,
				},
			)
		).data;
	}

	static async toggleAutoDeploy({
		orgId,
		appId,
		versionId,
		envId,
		...data
	}: ToggleAutoDeployParams): Promise<Environment> {
		return (
			await axios.put(`${this.url}/${orgId}/app/${appId}/version/${versionId}/env/${envId}`, data)
		).data;
	}

	static async suspendEnvironment({
		orgId,
		appId,
		versionId,
		envId,
	}: VersionParams): Promise<Environment> {
		return (
			await axios.post(
				`${this.url}/${orgId}/app/${appId}/version/${versionId}/env/${envId}/suspend`,
				{},
			)
		).data;
	}

	static async activateEnvironment({
		orgId,
		appId,
		versionId,
		envId,
	}: VersionParams): Promise<Environment> {
		return (
			await axios.post(
				`${this.url}/${orgId}/app/${appId}/version/${versionId}/env/${envId}/activate`,
				{},
			)
		).data;
	}

	static async redeployAppVersionToEnvironment({
		orgId,
		appId,
		versionId,
		envId,
	}: VersionParams): Promise<Environment> {
		return (
			await axios.post(
				`${this.url}/${orgId}/app/${appId}/version/${versionId}/env/${envId}/redeploy`,
				{},
			)
		).data;
	}

	static async restartApiServers({ orgId, appId, versionId, envId }: VersionParams): Promise<void> {
		return (
			await axios.post(
				`${this.url}/${orgId}/app/${appId}/version/${versionId}/env/${envId}/apiserver-restart`,
				{},
			)
		).data;
	}

	static async updateEnvironmentTelemetryLogs({
		orgId,
		appId,
		versionId,
		envId,
		logId,
	}: UpdateEnvironmentTelemetryLogsParams) {
		return (
			await axios.post(
				`${this.url}/${orgId}/app/${appId}/version/${versionId}/env/${envId}/log/${logId}`,
				{},
			)
		).data;
	}

	static async getEnvironmentResources({
		orgId,
		appId,
		versionId,
		envId,
	}: GetEnvironmentResourcesParams): Promise<Resource[]> {
		return (
			await axios.get(
				`${this.url}/${orgId}/app/${appId}/version/${versionId}/env/${envId}/resources`,
			)
		).data;
	}

	static async updateAPIServerConf({
		orgId,
		appId,
		versionId,
		envId,
		...data
	}: UpdateAPIServerConfParams): Promise<Resource> {
		return (
			await axios.put(
				`${this.url}/${orgId}/app/${appId}/version/${versionId}/env/${envId}/apiserver`,
				data,
			)
		).data;
	}
}
