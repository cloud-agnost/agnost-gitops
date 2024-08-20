import { axios } from "@/helpers";
import {
  Cluster,
  ClusterComponent,
  ClusterReleaseInfo,
  DomainParams,
  EnforceSSLAccessParams,
  TransferRequest,
  UpdateRemainingClusterComponentsParams,
} from "@/types";

export default class ClusterService {
  static url = "/v1/cluster";

  static async checkCompleted(): Promise<{ status: boolean }> {
    return (await axios.get(`${this.url}/setup-status`)).data;
  }

  static async getClusterStorageInfo() {
    return (await axios.get(`/v1/cluster/storage-info`)).data;
  }

  static async transferClusterOwnership({ userId }: TransferRequest) {
    return (
      await axios.post(`/v1/user/transfer/${userId}`, {
        userId,
      })
    ).data;
  }

  static async getClusterInfo() {
    return (await axios.get(`${this.url}/info`)).data;
  }

  static async getClusterAndReleaseInfo(): Promise<ClusterReleaseInfo> {
    return (await axios.get(`${this.url}/release-info`)).data;
  }
  static async updateClusterRelease(data: { release: string }) {
    return (await axios.put(`${this.url}/update-release`, data)).data;
  }
  static async addDomain(data: DomainParams): Promise<Cluster> {
    return (await axios.post(`${this.url}/domains`, data)).data;
  }
  static async deleteDomain(data: DomainParams): Promise<Cluster> {
    return (await axios.delete(`${this.url}/domains`, { data })).data;
  }
  static async enforceSSL(data: EnforceSSLAccessParams): Promise<Cluster> {
    return (await axios.put(`${this.url}/domains/enforce-ssl`, data)).data;
  }
  static async checkDomainStatus() {
    return (await axios.get(`${this.url}/domain-status`)).data;
  }
  static async updateRemainingClusterComponents(
    data: UpdateRemainingClusterComponentsParams
  ): Promise<ClusterComponent> {
    return (await axios.put(`${this.url}/${data.componentName}/update`, data))
      .data;
  }

  static async enabledCICD() {
    return (await axios.post(`${this.url}/cicd/enable`, {})).data;
  }
  static async disabledCICD() {
    return (await axios.post(`${this.url}/cicd/disable`, {})).data;
  }

  static async getContainerTemplates() {
    return (await axios.get(`${this.url}/templates`)).data;
  }
  static async getContainerTemplate(name: string, version: string) {
    return (
      await axios.get(`${this.url}/template`, { params: { name, version } })
    ).data;
  }

  static async setReverseProxyURL(reverseProxyURL: string): Promise<Cluster> {
    return (
      await axios.put(`${this.url}/reverse-proxy-url`, {
        reverseProxyURL: reverseProxyURL || undefined,
      })
    ).data;
  }

  static async getAllRegistries() {
    return (await axios.get("/v1/registry")).data;
  }

  static async healthCheck() {
    return (await axios.get(`/health`)).data;
  }
}
