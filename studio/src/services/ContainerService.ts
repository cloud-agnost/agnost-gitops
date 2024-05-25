import { axios } from "@/helpers";
import {
  AddGitProviderParams,
  Container,
  ContainerEvent,
  ContainerLog,
  ContainerPipeline,
  ContainerPipelineLogs,
  ContainerPod,
  CreateContainerParams,
  DeleteContainerParams,
  GetBranchesParams,
  GetContainerPipelineLogsParams,
  GetContainersInEnvParams,
  GitBranch,
  GitProvider,
  GitRepo,
  UpdateContainerParams,
} from "@/types/container";
export default class ContainerService {
  static url = "/v1/org";

  static async addGitProvider(req: AddGitProviderParams): Promise<GitProvider> {
    return (await axios.post(`/v1/user/git`, req)).data;
  }
  static async disconnectGitProvider(gitProviderId: string) {
    return axios.delete(`/v1/user/git/${gitProviderId}`);
  }
  static async getGitRepositories(gitProviderId: string): Promise<GitRepo[]> {
    return (await axios.get(`/v1/user/git/${gitProviderId}/repo`)).data;
  }
  static async getGitBranches({
    gitProviderId,
    owner,
    repo,
  }: GetBranchesParams): Promise<GitBranch[]> {
    return (
      await axios.get(`/v1/user/git/${gitProviderId}/repo/branch`, {
        params: { owner, repo },
      })
    ).data;
  }

  static async createContainer({
    orgId,
    projectId,
    envId,
    ...req
  }: CreateContainerParams): Promise<Container> {
    return (
      await axios.post(
        `${this.url}/${orgId}/project/${projectId}/env/${envId}/container`,
        req
      )
    ).data;
  }

  static async getContainersInEnv({
    orgId,
    projectId,
    envId,
    ...params
  }: GetContainersInEnvParams): Promise<Container[]> {
    return (
      await axios.get(
        `${this.url}/${orgId}/project/${projectId}/env/${envId}/container`,
        {
          params: params,
        }
      )
    ).data;
  }

  static async updateContainer({
    orgId,
    projectId,
    envId,
    containerId,
    ...req
  }: UpdateContainerParams): Promise<Container> {
    return (
      await axios.put(
        `${this.url}/${orgId}/project/${projectId}/env/${envId}/container/${containerId}`,
        req
      )
    ).data;
  }

  static async deleteContainer({
    orgId,
    projectId,
    envId,
    containerId,
  }: DeleteContainerParams): Promise<void> {
    return await axios.delete(
      `${this.url}/${orgId}/project/${projectId}/env/${envId}/container/${containerId}`,
      {
        data: {},
      }
    );
  }

  static async getContainerPods({
    orgId,
    projectId,
    envId,
    containerId,
  }: DeleteContainerParams): Promise<ContainerPod[]> {
    return (
      await axios.get(
        `${this.url}/${orgId}/project/${projectId}/env/${envId}/container/${containerId}/pods`
      )
    ).data;
  }

  static async getContainerLogs({
    orgId,
    projectId,
    envId,
    containerId,
  }: DeleteContainerParams): Promise<ContainerLog> {
    return (
      await axios.get(
        `${this.url}/${orgId}/project/${projectId}/env/${envId}/container/${containerId}/logs`
      )
    ).data;
  }

  static async getContainerEvents({
    orgId,
    projectId,
    envId,
    containerId,
  }: DeleteContainerParams): Promise<ContainerEvent[]> {
    return (
      await axios.get(
        `${this.url}/${orgId}/project/${projectId}/env/${envId}/container/${containerId}/events`
      )
    ).data;
  }
  static async getContainerPipelines({
    orgId,
    projectId,
    envId,
    containerId,
  }: DeleteContainerParams): Promise<ContainerPipeline[]> {
    return (
      await axios.get(
        `${this.url}/${orgId}/project/${projectId}/env/${envId}/container/${containerId}/pipelines`
      )
    ).data;
  }
  static async getContainerPipelineLogs({
    orgId,
    projectId,
    envId,
    containerId,
    pipelineName,
  }: GetContainerPipelineLogsParams): Promise<ContainerPipelineLogs[]> {
    return (
      await axios.get(
        `${this.url}/${orgId}/project/${projectId}/env/${envId}/container/${containerId}/pipelines/${pipelineName}`
      )
    ).data;
  }
}
