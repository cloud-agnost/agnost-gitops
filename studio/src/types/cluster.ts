import { Environment } from "./environment";
import { Organization } from "./organization";
import { Project } from "./project";

export type ClusterComponentsType =
  | "Node.js"
  | "React"
  | "MongoDB"
  | "RabbitMQ"
  | "Redis"
  | "MinIO";
export type ClusterK8sType = "Deployment" | "StatefulSet";

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

export interface UpdateClusterComponentParams {
  hpaName: string;
  deploymentName: string;
  replicas: number;
  minReplicas: number;
  maxReplicas: number;
}

export interface ClusterSetupResponse {
  org: Organization;
  project: Project;
  environment: Environment;
}

export interface ModuleVersions {
  monitor: string;
  platform: string;
  studio: string;
  sync: string;
  webhooks: string;
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
  reverseProxyURL: string;
  slug: string;
  certificateStatus?: "Issuing" | "Issued" | "Not Ready" | "Error";
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

export interface ClusterStorageInfo {
  podName: string;
  containerName: string;
  filesystem: string;
  size: string;
  used: string;
  available: string;
  usedPercentage: string;
  mountPoint: string;
}
