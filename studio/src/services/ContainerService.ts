import { axios } from "@/helpers";
import {
  AddGitProviderParams,
  Container,
  ContainerEvent,
  ContainerLog,
  ContainerPipeline,
  ContainerPipelineActions,
  ContainerPipelineLogs,
  ContainerPod,
  CreateContainerParams,
  DeleteContainerParams,
  DeleteContainerPodParams,
  GetBranchesParams,
  GetContainerPipelineLogsParams,
  GetContainersInEnvParams,
  GitBranch,
  GitProvider,
  GitRepo,
  UpdateContainerParams,
} from "@/types";
export default class ContainerService {
  static readonly url = "/v1/org";

  static async getGitProviders(): Promise<GitProvider[]> {
    return (await axios.get("/v1/user/git/")).data;
  }

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
    repoId,
  }: GetBranchesParams): Promise<GitBranch[]> {
    return (
      await axios.get(`/v1/user/git/${gitProviderId}/repo/branch`, {
        params: { owner, repo, repoId },
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

  static async getGitProviderById(gitProviderId: string): Promise<GitProvider> {
    return (await axios.get(`/v1/user/git/${gitProviderId}`)).data;
  }

  static deleteContainerPod({
    containerId,
    envId,
    orgId,
    podName,
    projectId,
  }: DeleteContainerPodParams): Promise<void> {
    return axios.delete(
      `${this.url}/${orgId}/project/${projectId}/env/${envId}/container/${containerId}/pods/${podName}`
    );
  }

  static async rerunPipeline({
    containerId,
    envId,
    orgId,
    pipelineName,
    projectId,
  }: ContainerPipelineActions): Promise<void> {
    return axios.post(
      `${this.url}/${orgId}/project/${projectId}/env/${envId}/container/${containerId}/pipelines/${pipelineName}/rerun`
    );
  }
  static async deletePipelineRun({
    containerId,
    envId,
    orgId,
    pipelineName,
    projectId,
  }: ContainerPipelineActions): Promise<void> {
    return axios.post(
      `${this.url}/${orgId}/project/${projectId}/env/${envId}/container/${containerId}/pipelines/${pipelineName}/delete`
    );
  }
  static async cancelPipelineRun({
    containerId,
    envId,
    orgId,
    pipelineName,
    projectId,
  }: ContainerPipelineActions): Promise<void> {
    return axios.post(
      `${this.url}/${orgId}/project/${projectId}/env/${envId}/container/${containerId}/pipelines/${pipelineName}/cancel`
    );
  }

  static async triggerBuild({
    containerId,
    envId,
    orgId,
    projectId,
  }: DeleteContainerParams): Promise<ContainerPipelineLogs[]> {
    return axios.post(
      `${this.url}/${orgId}/project/${projectId}/env/${envId}/container/${containerId}/trigger`
    );
  }
}
