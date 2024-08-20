import { axios } from "@/helpers";
import {
  CreateNewEnvironmentRequest,
  DeleteEnvironmentRequest,
  GetEnvironmentByIdRequest,
  GetEnvironmentRequest,
  UpdateEnvironmentRequest,
} from "@/types";

export default class EnvironmentService {
  static url = "/v1/org";
  static async getEnvironments(req: GetEnvironmentRequest) {
    const { projectId } = req;
    return (
      await axios.get(`${this.url}/${req.orgId}/project/${projectId}/env`)
    ).data;
  }

  static async getEnvironment(req: GetEnvironmentByIdRequest) {
    const { projectId, envId, orgId } = req;
    return (
      await axios.get(`${this.url}/${orgId}/project/${projectId}/env/${envId}`)
    ).data;
  }

  static async createEnvironment({
    orgId,
    projectId,
    ...params
  }: CreateNewEnvironmentRequest) {
    return (
      await axios.post(`${this.url}/${orgId}/project/${projectId}/env`, params)
    ).data;
  }

  static async updateEnvironment({
    orgId,
    projectId,
    envId,
    ...params
  }: UpdateEnvironmentRequest) {
    return (
      await axios.put(
        `${this.url}/${orgId}/project/${projectId}/env/${envId}`,
        params
      )
    ).data;
  }

  static async deleteEnvironment({
    orgId,
    projectId,
    envId,
  }: DeleteEnvironmentRequest) {
    return (
      await axios.delete(
        `${this.url}/${orgId}/project/${projectId}/env/${envId}`,
        {}
      )
    ).data;
  }
}
