import useTypeStore from "@/store/types/typeStore";
import parser from "cron-parser";
import { z } from "zod";
import { NameSchema } from "./schema";
import { BaseGetRequest } from "./type";

export const DeploymentConfigSchema = z
  .object({
    desiredReplicas: z
      .number({
        coerce: true,
        invalid_type_error: "Desired replicas should be a number",
      })
      .int("Desired replicas should be an integer")
      .positive("Desired replicas should be greater than 0")
      .max(100, "Desired replicas should be less than 100")
      .transform((value) => Math.round(value))
      .default(1)
      .optional(),
    minReplicas: z
      .number({
        coerce: true,
        invalid_type_error: "Min replicas should be a number",
      })
      .int("Min replicas should be an integer")
      .positive("Min replicas should be greater than 0")
      .max(100, "Min replicas should be less than 100")
      .transform((value) => Math.round(value))
      .default(1)
      .optional(),
    maxReplicas: z
      .number({
        coerce: true,
        invalid_type_error: "Max replicas should be a number",
      })
      .int("Max replicas should be an integer")
      .positive("Max replicas should be greater than 0")
      .max(100, "Max replicas should be less than 100")
      .transform((value) => Math.round(value))
      .default(1)
      .optional(),
    cpuMetric: z
      .object({
        enabled: z.boolean(),
        metricType: z
          .enum([
            "AverageUtilization",
            "AverageValueMillicores",
            "AverageValueCores",
          ])
          .optional(),
        metricValue: z
          .number({
            coerce: true,
            invalid_type_error: "Metric value should be a number",
          })
          .positive("Metric value should be greater than 0")
          .optional(),
      })
      .optional(),
    memoryMetric: z
      .object({
        enabled: z.boolean().optional(),
        metricType: z
          .enum(["AverageValueMebibyte", "AverageValueGibibyte"])
          .optional(),
        metricValue: z
          .number({
            coerce: true,
            invalid_type_error: "Metric value should be a number",
          })
          .positive("Metric value should be greater than 0")
          .optional(),
      })
      .optional(),
    strategy: z.enum(["RollingUpdate", "Recreate"]).optional(),
    rollingUpdate: z
      .object({
        maxSurge: z.union([z.number(), z.string()]).optional(),
        maxSurgeType: z.enum(["number", "percentage"]).optional(),
        maxUnavailable: z.union([z.number(), z.string()]).optional(),
        maxUnavailableType: z.enum(["number", "percentage"]).optional(),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.cpuMetric?.enabled) {
      if (!data.cpuMetric.metricType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "CPU metric type is required",
          path: ["cpuMetric", "metricType"],
        });
      }
      if (!data.cpuMetric.metricValue) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "CPU metric value is required",
          path: ["cpuMetric", "metricValue"],
        });
      }
      if (
        ["AverageValueMillicores", "AverageValueCores"].includes(
          data.cpuMetric.metricType!
        )
      ) {
        checkCPU(
          data.cpuMetric.metricValue!,
          data.cpuMetric.metricType! as CPUUnitType,
          ctx,
          "cpuMetric.metricValue"
        );
      }
    }

    if (data.memoryMetric?.enabled) {
      if (!data.memoryMetric.metricType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Memory metric type is required",
          path: ["memoryMetric", "metricType"],
        });
      }
      if (!data.memoryMetric.metricValue) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Memory metric value is required",
          path: ["memoryMetric", "metricValue"],
        });
      }
      checkMemory(
        data.memoryMetric.metricValue!,
        data.memoryMetric.metricType!,
        ctx,
        "memoryMetric.metricValue"
      );
    }

    if (data.memoryMetric?.enabled || data.cpuMetric?.enabled) {
      if (!data.minReplicas) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Min replicas is required",
          path: ["minReplicas"],
        });
      }
      if (!data.maxReplicas) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Max replicas is required",
          path: ["maxReplicas"],
        });
      }

      if (data.minReplicas! > data.maxReplicas!) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Min replicas should be less than or equal to max replicas",
          path: ["minReplicas"],
        });
      }
    }
  });

export const StatefulSetConfigSchema = z.object({
  desiredReplicas: z
    .number({
      coerce: true,
      invalid_type_error: "Desired replicas should be a number",
    })
    .int()
    .positive("Desired replicas should be greater than 0")
    .max(100, "Desired replicas should be less than 100")
    .transform((value) => Math.round(value))
    .default(1),
  strategy: z.enum(["RollingUpdate", "Recreate"]).optional(),
  rollingUpdate: z
    .object({
      maxUnavailable: z.union([z.number(), z.string()]).optional(),
      maxUnavailableType: z.enum(["number", "percentage"]).optional(),
      partition: z.number().optional(),
    })
    .optional(),
  podManagementPolicy: z.enum(["OrderedReady", "Parallel"]).optional(),
  persistentVolumeClaimRetentionPolicy: z
    .object({
      whenDeleted: z.enum(["Retain", "Delete"]).optional(),
      whenScaled: z.enum(["Retain", "Delete"]).optional(),
    })
    .optional(),
});
export const CronJobConfigSchema = z.object({
  schedule: z
    .string({
      required_error: "Schedule is required",
    })
    .superRefine((value, ctx) => {
      try {
        parser.parseExpression(value);
        return true;
      } catch (e) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid cron expression",
        });
        return false;
      }
    })
    .optional(),
  timeZone: z
    .string()
    .refine(
      (value) =>
        useTypeStore.getState().timezones.some((tz) => tz.value === value),
      {
        message: "Invalid timezone",
      }
    )
    .optional(),
  concurrencyPolicy: z.enum(["Allow", "Forbid", "Replace"]).optional(),
  suspend: z.boolean().default(false),
  successfulJobsHistoryLimit: z.number().optional(),
  failedJobsHistoryLimit: z.number().optional(),
});

export const KnativeConfigSchema = z.object({
  initialScale: z
    .number({
      coerce: true,
      invalid_type_error: "Initial Scale should be a number",
    })
    .int("Initial Scale should be an integer")
    .positive("Initial Scale should be greater than 0")
    .max(100, "Initial Scale should be less than 100")
    .transform((value) => Math.round(value))
    .default(1)
    .optional(),
  concurrency: z
    .number({
      coerce: true,
      invalid_type_error: "Concurrency should be a number",
    })
    .positive("Concurrency should be greater than 0")
    .max(100, "Concurrency should be less than 100")
    .int()
    .transform((value) => Math.round(value))
    .default(100)
    .optional(),
  scalingMetric: z
    .enum(["concurrency", "rps", "cpu", "memory"])
    .optional()
    .optional(),
  scalingMetricTarget: z
    .number({
      coerce: true,
      invalid_type_error: "Scaling metric target should be a number",
    })
    .optional(),
  minScale: z
    .number({
      coerce: true,
      invalid_type_error: "Min scale should be a number",
    })
    .int({
      message: "Min scale should be an integer",
    })
    .min(0, "Min scale should be greater than or equal to 0")
    .max(100, "Min scale should be less than 100")
    .transform((value) => Math.round(value))
    .optional(),
  maxScale: z
    .number({
      coerce: true,
      invalid_type_error: "Max scale should be a number",
    })
    .int({
      message: "Max scale should be an integer",
    })
    .positive({
      message: "Max scale should be greater than 0",
    })
    .max(100, "Max scale should be less than 100")
    .transform((value) => Math.round(value))
    .optional(),
  scaleDownDelay: z
    .number({
      coerce: true,
      invalid_type_error: "Scale down delay should be a number",
    })
    .int({
      message: "Scale down delay should be an integer",
    })
    .min(0, "Scale down delay should be greater than or equal to 0")
    .max(3600, "Scale down delay should be less than 3600")
    .transform((value) => Math.round(value))
    .optional(),
  scaleToZeroPodRetentionPeriod: z
    .number({
      coerce: true,
      invalid_type_error: "Scale down delay should be a number",
    })
    .int({
      message: "Scale down delay should be an integer",
    })
    .min(0, "Scale down delay should be greater than or equal to 0")
    .max(3600, "Scale down delay should be less than 3600")
    .transform((value) => Math.round(value))
    .optional(),
});
// .superRefine((data, ctx) => {
// min scale should be less than or equal to max scale
// if (data.minScale! > data.maxScale!) {
// 	ctx.addIssue({
// 		code: z.ZodIssueCode.custom,
// 		message: 'Min scale should be less than or equal to max scale',
// 		path: ['minScale'],
// 	});
// }
// if (data.scalingMetric === 'cpu') {
// 	checkCPU(data.scalingMetricTarget, 'millicores', ctx, 'scalingMetricTarget');
// } else if (data.scalingMetric === 'memory') {
// 	checkMemory(data.scalingMetricTarget, 'mebibyte', ctx, 'scalingMetricTarget');
// }
// });

export const NetworkingSchema = z.object({
  containerPort: z
    .number({
      required_error: "Container port is required",
      coerce: true,
      invalid_type_error: "Container port should be a number",
    })
    .int()
    .positive("Container port should be greater than 0")
    .max(65535, "Container port should be less than 65536")
    .transform((value) => Math.round(value)),
  ingress: z
    .object({
      enabled: z.boolean().optional(),
      url: z.string().optional(),
    })
    .optional(),
  customDomain: z
    .object({
      enabled: z.boolean().optional(),
      added: z.boolean().optional(),
      domain: z.string().optional(),
    })
    .optional(),
  tcpProxy: z
    .object({
      enabled: z.boolean().optional(),
      publicPort: z.number().optional(),
    })
    .optional(),
});
const ProbeConfigSchema = z
  .object({
    enabled: z.boolean(),
    checkMechanism: z
      .enum(["exec", "httpGet", "tcpSocket"], {
        invalid_type_error: '"Unsupported probe check mechanism type"',
      })
      .optional(),
    execCommand: z.string().optional(),
    httpPath: z
      .string({
        required_error: "HTTP path is required",
      })
      .startsWith("/", "HTTP path must start with a '/' character")
      .regex(
        /^\/([\w\-\/]*)$/,
        "Not a valid path. Path names include alphanumeric characters, underscore, hyphens, and additional slashes."
      )
      .optional(),
    httpPort: z
      .number({
        required_error: "HTTP port is required",
        coerce: true,
        invalid_type_error: "HTTP port should be a number",
      })
      .int()
      .positive("HTTP port should be greater than 0")
      .max(65535, "HTTP port should be less than 65536")
      .transform((value) => Math.round(value))
      .optional(),
    tcpPort: z
      .number({
        required_error: "TCP port is required",
        coerce: true,
        invalid_type_error: "TCP port should be a number",
      })
      .int()
      .positive("TCP port should be greater than 0")
      .max(65535, "TCP port should be less than 65536")
      .transform((value) => Math.round(value))
      .optional(),
    initialDelaySeconds: z
      .number({
        coerce: true,
        invalid_type_error: "Initial delay should be a number",
      })
      .positive("Initial delay should be greater than 0")
      .max(3600, "Initial delay should be less than 3600")
      .transform((value) => Math.round(value))
      .optional(),
    periodSeconds: z
      .number({
        coerce: true,
        invalid_type_error: "Period should be a number",
      })
      .positive("Period should be greater than 0")
      .max(3600, "Period should be less than 3600")
      .transform((value) => Math.round(value))
      .optional(),
    timeoutSeconds: z
      .number({
        coerce: true,
        invalid_type_error: "Timeout should be a number",
      })
      .positive("Timeout should be greater than 0")
      .max(3600, "Timeout should be less than 3600")
      .transform((value) => Math.round(value))
      .optional(),
    failureThreshold: z
      .number({
        coerce: true,
        invalid_type_error: "Failure Threshold should be a number",
      })
      .positive("Failure Threshold should be greater than 0")
      .max(20, "Failure Threshold should be less than 20")
      .transform((value) => Math.round(value))
      .optional(),
  })
  .superRefine((data, ctx) => {
    // all probe fields are required if probe is enabled
    if (data.enabled) {
      if (!data.checkMechanism) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Check mechanism is required",
          path: ["checkMechanism"],
        });
      }
      if (data.checkMechanism === "exec" && !data.execCommand) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Exec command is required",
          path: ["execCommand"],
        });
      }
      if (data.checkMechanism === "httpGet") {
        if (!data.httpPath) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "HTTP path is required",
            path: ["httpPath"],
          });
        }
        if (!data.httpPort) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "HTTP port is required",
            path: ["httpPort"],
          });
        }
      }
      if (data.checkMechanism === "tcpSocket") {
        if (!data.tcpPort) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "TCP port is required",
            path: ["tcpPort"],
          });
        }
      }
      if (!data.initialDelaySeconds) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Initial delay is required",
          path: ["initialDelaySeconds"],
        });
      }
      if (!data.periodSeconds) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Period is required",
          path: ["periodSeconds"],
        });
      }
      if (!data.timeoutSeconds) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Timeout is required",
          path: ["timeoutSeconds"],
        });
      }
      if (!data.failureThreshold) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Failure threshold is required",
          path: ["failureThreshold"],
        });
      }
    }
  });
export const ProbesSchema = z.object({
  startup: ProbeConfigSchema,
  readiness: ProbeConfigSchema,
  liveness: ProbeConfigSchema,
});

export const PodConfigSchema = z
  .object({
    restartPolicy: z.enum(["Always", "OnFailure", "Never"], {
      invalid_type_error: "Unsupported restart policy",
    }),
    cpuRequest: z.number({
      coerce: true,
      invalid_type_error: "CPU request should be a number",
    }),
    cpuRequestType: z.enum(["millicores", "cores"]).default("millicores"),
    cpuLimit: z
      .number({
        coerce: true,
        invalid_type_error: "CPU limit should be a number",
      })
      .transform((value) => Math.round(value))
      .default(1),
    cpuLimitType: z.enum(["millicores", "cores"]).default("cores"),
    memoryRequest: z
      .number({
        coerce: true,
        invalid_type_error: "Memory request should be a number",
      })
      .default(128),
    memoryRequestType: z.enum(["mebibyte", "gibibyte"]).default("mebibyte"),
    memoryLimit: z
      .number({
        coerce: true,
        invalid_type_error: "Memory limit should be a number",
      })
      .default(1),
    memoryLimitType: z.enum(["mebibyte", "gibibyte"]).default("gibibyte"),
  })
  .superRefine((data, ctx) => {
    checkCPU(data.cpuRequest, data.cpuRequestType, ctx, "cpuRequest");
    checkCPU(data.cpuLimit, data.cpuLimitType, ctx, "cpuLimit");
    checkMemory(
      data.memoryRequest,
      data.memoryRequestType,
      ctx,
      "memoryRequest"
    );
    checkMemory(data.memoryLimit, data.memoryLimitType, ctx, "memoryLimit");
    const cpuRequest = parseCpuValue(data.cpuRequest, data.cpuRequestType);
    const cpuLimit = parseCpuValue(data.cpuLimit, data.cpuLimitType);

    const memoryRequest = parseMemoryValue(
      data.memoryRequest,
      data.memoryRequestType
    );
    const memoryLimit = parseMemoryValue(
      data.memoryLimit,
      data.memoryLimitType
    );

    if (cpuRequest && cpuLimit) {
      if (cpuRequest > cpuLimit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "CPU request should be less than or equal to CPU limit",
          path: ["cpuRequest"],
        });
      }
    }

    if (memoryRequest && memoryLimit) {
      if (memoryRequest > memoryLimit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Memory request should be less than or equal to Memory limit",
          path: ["memoryRequest"],
        });
      }
    }
  });

export const StorageConfigSchema = z
  .object({
    enabled: z.boolean(),
    mountPath: z
      .string()
      .startsWith("/", "Mount path must start with a '/' character")
      .regex(
        /^\/([\w\-\/]*)$/,
        "Not a valid path. Path names include alphanumeric characters, underscore, hyphens, and additional slashes."
      )
      .optional(),
    size: z
      .number({
        coerce: true,
        invalid_type_error: "Storage size should be a number",
      })
      .int()
      .positive()
      .transform((value) => Math.round(value))
      .optional(),
    sizeType: z.enum(["mebibyte", "gibibyte"]).optional(),
    accessModes: z
      .array(z.enum(["ReadWriteOnce", "ReadOnlyMany", "ReadWriteMany"]))
      .optional(),
  })
  .superRefine((data, ctx) => {
    // all values are required if storage is enabled
    if (data.enabled) {
      if (!data.mountPath) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Mount path is required",
          path: ["mountPath"],
        });
      }
      if (!data.size) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Size is required",
          path: ["size"],
        });
      } else {
        checkStorage(data.size, data.sizeType!, ctx, "size");
      }
      if (!data.sizeType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Size type is required",
          path: ["sizeType"],
        });
      }
      if (!data.accessModes) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Access modes are required",
          path: ["accessModes"],
        });
      }
    }
  });

export const SourceConfigSchema = z
  .object({
    type: z.enum(["github", "gitlab", "bitbucket"]),
    connected: z.boolean().default(false),
    gitProviderId: z.string().optional(),
    name: z
      .string({
        required_error: "Repository is required",
      })
      .trim()
      .optional(),
    url: z
      .union([
        z.string().url(),
        z.string().regex(/^https:\/\/github.com\/[\w-]+\/[\w-]+$/),
        z.literal(""),
      ])
      .optional(),
    branch: z
      .string({
        required_error: "Branch is required",
      })
      .trim()
      .optional(),
    path: z
      .string({
        required_error: "Path is required",
      })
      .startsWith("/", "Path must start with a '/' character")
      .regex(
        /^\/([\w\-\/]*)$/,
        "Not a valid path. Path names include alphanumeric characters, underscore, hyphens, and additional slashes."
      )
      .optional(),
    dockerfile: z
      .string({
        required_error: "Docker file is required",
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    // all values are required if source is connected
    if (data.connected) {
      if (!data.name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Repository is required",
          path: ["name"],
        });
      }
      if (!data.url) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "URL is required",
          path: ["url"],
        });
      }
      if (!data.branch) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Branch is required",
          path: ["branch"],
        });
      }
      if (!data.path) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Path is required",
          path: ["path"],
        });
      }
      if (!data.dockerfile) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Docker file is required",
          path: ["dockerfile"],
        });
      }
    }
  });

export const ContainerSchema = z.object({
  orgId: z.string(),
  projectId: z.string(),
  envId: z.string(),
  name: NameSchema,
  type: z.enum(["deployment", "stateful set", "cron job", "knative service"]),
  variables: z.array(z.object({ name: z.string(), value: z.string() })),
  repoOrRegistry: z.enum(["repo", "registry"]),
  registry: z
    .object({
      registryId: z.string().optional(),
      image: z.string().url().optional(),
    })
    .optional(),
  repo: SourceConfigSchema.optional(),
  deploymentConfig: DeploymentConfigSchema.optional(),
  statefulSetConfig: StatefulSetConfigSchema.optional(),
  cronJobConfig: CronJobConfigSchema.optional(),
  knativeConfig: KnativeConfigSchema.optional(),
  networking: NetworkingSchema.optional(),
  probes: ProbesSchema.optional(),
  podConfig: PodConfigSchema.optional(),
  storageConfig: StorageConfigSchema.optional(),
});

export enum ContainerType {
  Deployment = "deployment",
  StatefulSet = "stateful set",
  CronJob = "cron job",
  KNativeService = "knative service",
}

export type CreateContainerParams = z.infer<typeof ContainerSchema>;
export const ContainerUpdateSchema = ContainerSchema.partial();
export type UpdateContainerParams = z.infer<typeof ContainerUpdateSchema> & {
  containerId: string;
};
export type Container = z.infer<typeof ContainerSchema> & {
  _id: string;
  iid: string;
  environmentId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  status: ContainerStatus;
  pipelineStatus: ContainerPipelineStatus;
};

export interface ContainerStatus {
  availableReplicas: number;
  conditions: PodCondition[];
  observedGeneration: number;
  readyReplicas: number;
  replicas: number;
  updatedReplicas: number;
  status:
    | "Creating"
    | "Running"
    | "Updating"
    | "Failed"
    | "Successful"
    | "Unknown"
    | "Error"
    | "Warning"
    | "Pending"
    | "Terminating"
    | "Terminated";
  creationTimestamp: string;
}

export interface GetContainersInEnvParams extends BaseGetRequest {
  orgId: string;
  projectId: string;
  envId: string;
}

export interface DeleteContainerParams {
  orgId: string;
  projectId: string;
  envId: string;
  containerId: string;
}

export interface GetContainerPipelineLogsParams extends DeleteContainerParams {
  pipelineName: string;
}
export interface AddGitProviderParams {
  provider: "github" | "gitlab" | "bitbucket";
  accessToken: string;
  refreshToken: string;
}

export interface GetBranchesParams {
  gitProviderId: string;
  repo: string;
  owner: string;
}
export interface GitProvider {
  iid: string;
  userId: string;
  provider: string;
  providerUserId: string;
  username: string;
  email: string;
  avatar: string;
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface GitRepo {
  repoId: number;
  owner: string;
  repo: string;
  fullName: string;
  private: boolean;
  url: string;
}

export interface GitBranch {
  name: string;
  protected: boolean;
}

export interface StateOption {
  readonly value: string;
  readonly label: string;
}

type CPUUnitType =
  | "millicores"
  | "cores"
  | "AverageValueMillicores"
  | "AverageValueCores";
type MemoryUnitType =
  | "mebibyte"
  | "gibibyte"
  | "AverageValueMebibyte"
  | "AverageValueGibibyte";

function checkCPU(
  value: number,
  unit: CPUUnitType,
  ctx: z.RefinementCtx,
  path: string
) {
  if (unit === "millicores" || unit === "AverageValueMillicores") {
    if (!Number.isInteger(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CPU amount must be an integer when using millicores",
        path: [path],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CPU amount must be an integer when using millicores",
        path: [path],
      });
    }

    if (value < 10 || value > 1000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CPU amount must be between 10 and 1000 when using millicores",
        path: [path],
      });
    }
  } else if (unit === "cores" || unit === "AverageValueCores") {
    if (value < 0.1 || value > 4) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CPU amount must be between 0.1 and 4 when using cores",
        path: [path],
      });
    }
  }
}

function parseCpuValue(cpuValue: number, unit: CPUUnitType) {
  if (cpuValue && unit) {
    if (unit === "millicores") {
      return cpuValue;
    }

    return cpuValue * 1000; // Cores to Millicores
  }

  return undefined;
}

function checkMemory(
  value: number,
  unit: MemoryUnitType,
  ctx: z.RefinementCtx,
  path: string
) {
  if (unit === "mebibyte" || unit === "AverageValueMebibyte") {
    if (!Number.isInteger(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Memory amount must be an integer when using mebibytes",
        path: [path],
      });
    }

    if (value < 10 || value > 1024) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Memory amount must be between 10 and 1024 when using mebibytes",
        path: [path],
      });
    }
  } else if (unit === "gibibyte" || unit === "AverageValueGibibyte") {
    if (value < 0.1 || value > 16) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Memory amount must be between 0.1 and 16 when using gibibytes",
        path: [path],
      });
    }
  }

  return true;
}

function parseMemoryValue(memoryValue: number, unit: MemoryUnitType) {
  if (memoryValue && unit) {
    if (unit === "mebibyte") {
      return memoryValue; // Mebibytes
    }

    return memoryValue * 1024; // Gibibytes to Mebibytes
  }

  return undefined;
}

function checkStorage(
  value: number,
  unit: "mebibyte" | "gibibyte",
  ctx: z.RefinementCtx,
  path: string
) {
  // First check if the value is a number

  if (unit === "mebibyte") {
    if (!Number.isInteger(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Storage amount must be an integer when using mebibytes",
        path: [path],
      });
    }

    if (value < 10 || value > 1024) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Storage request must be between 10 and 1024 when using mebibytes",
        path: [path],
      });
    }
  } else if (unit === "gibibyte") {
    if (value < 0.1 || value > 5000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Storage request must be between 0.1 and 5000 when using gibibytes",
        path: [path],
      });
    }
  }

  return true;
}
export interface ContainerPod {
  name: string;
  status: string;
  totalContainers: number;
  readyContainers: number;
  restarts: number;
  createdOn: string;
  conditions: PodCondition[];
}

export interface PodCondition {
  lastProbeTime: null;
  lastTransitionTime: string;
  status: string;
  type: "PodScheduled" | "ContainersReady" | "Initialized" | "Ready";
  reason: string;
  message: string;
}

export interface ContainerLog {
  pods: ContainerPod[];
  logs: {
    podName: string;
    logs: string[];
  }[];
}
export interface ContainerEvent {
  name: string;
  message: string;
  reason: "SuccessfulCreate" | "FailedGetResourceMetric";
  firstSeen: string;
  lastSeen: string;
  count: number;
  kind: string;
  type: "Normal" | "Warning";
}

export type ContainerPipelineStatus =
  | "Failed"
  | "Succeeded"
  | "Running"
  | "Error"
  | "Started"
  | "Connected"
  | "Unknown";
export interface ContainerPipeline {
  name: string;
  status: ContainerPipelineStatus;
  durationSeconds: number;
  startTime: string;
  GIT_REPO: string;
  GIT_BRANCH: string;
  GIT_REVISION: string;
  GIT_COMMITTER_USERNAME: string;
  SUB_PATH: string;
  GIT_COMMIT_URL: string;
  GIT_REPO_URL: string;
  GIT_REPO_NAME: string;
  GIT_COMMIT_MESSAGE: string;
  GIT_COMMIT_TIMESTAMP: string;
  GIT_COMMIT_ID: string;
}

export type ContainerPipelineLogStatus =
  | "pending"
  | "running"
  | "success"
  | "error";
export type ContainerPipelineLogStep = "setup" | "build" | "deploy" | "push";
export interface ContainerPipelineLogs {
  step: ContainerPipelineLogStep;
  status: ContainerPipelineLogStatus;
  logs: string[];
}
