import { MEMORY_REGEX } from '@/constants/regex';
import useResourceStore from '@/store/resources/resourceStore';
import useTypeStore from '@/store/types/typeStore';
import { translate } from '@/utils';
import * as z from 'zod';
import { ResourceNameSchema } from '.';
import { BaseRequest } from './type';

export enum AllowedRole {
	Admin = 'Admin',
	Developer = 'Developer',
	Viewer = 'Viewer',
}
export enum ResourceCreateType {
	Existing = 'connect_existing',
	New = 'New',
}

export enum RabbitMQConnFormat {
	Object = 'object',
	URL = 'url',
}
export enum KafkaConnFormat {
	Simple = 'simple',
	SSL = 'ssl',
	SASL = 'sasl',
}
export enum KafkaSaslMechanism {
	Plain = 'plain',
	ScramSha256 = 'scram-sha-256',
	ScramSha512 = 'scram-sha-512',
}
export enum RabbitMQConnScheme {
	AMQP = 'amqp',
	AMQPS = 'amqps',
}
export enum MongoDBConnFormat {
	MongoDB = 'mongodb',
	MongoDBSRV = 'mongodb+srv',
}

export type DatabaseTypes = 'MySQL' | 'PostgreSQL' | 'MongoDB';

export interface ResourceAccessReadOnly {
	host?: string;
	port?: number;
	username?: string;
	password?: string;
	connFormat?: MongoDBConnFormat;
	encrypt?: boolean;
	options?: {
		key?: string;
		value?: string;
	}[];
	databaseNumber?: number;
}
export interface ResourceAccess extends ResourceAccessReadOnly {
	options?: {
		key?: string;
		value?: string;
	}[];
	accessIdKey?: string;
	secretAccessKey?: string;
	region?: string;
	projectId?: string;
	keyFileContents?: string;
	connectionString?: string;
	format?: RabbitMQConnFormat | KafkaConnFormat;
	url?: string;
	vhost?: string;
	scheme?: RabbitMQConnScheme;
	clientId?: string;
	brokers?: string[];
	ssl?: {
		rejectUnauthorized?: boolean;
		ca?: string;
		key?: string;
		cert?: string;
	};
	sasl?: { mechanism?: KafkaSaslMechanism; username?: string; password?: string };
}

export interface Resource {
	orgId: string;
	iid: string;
	appId: string;
	versionId: string;
	name: string;
	type: ResourceType;
	instance: string;
	managed: boolean;
	deletable: boolean;
	allowedRoles: AllowedRole[];
	tcpProxyEnabled: boolean;
	tcpProxyPort: number;
	config: {
		delayedMessages: boolean;
		size: string;
		instances: number;
		version: string;
		readReplica: true;
		replicas: number;
		initialScale: number;
		minScale: number;
		maxScale: number;
		scaleDownDelay: string;
		scaleToZeroPodRetentionPeriod: string;
		hpa: {
			avgCPU: number;
			avgMemory: number;
			minReplicas: number;
			maxReplicas: number;
		};
		cpu: {
			request: string;
			limit: string;
		};
		memory: {
			request: string;
			limit: string;
		};
	};
	access: ResourceAccess;
	accessReadOnly?: ResourceAccessReadOnly[];
	status: string;
	createdBy: string;
	_id: string;
	createdAt: string;
	updatedAt: string;
	availableReplicas?: number;
	unavailableReplicas?: number;
	__v: number;
}
export interface ResLog {
	orgId: string;
	appId: string;
	versionId: string;
	resourceId: string;
	action: string;
	status: string;
	createdBy: string;
	_id: string;
	logs: [];
	createdAt: string;
	updatedAt: string;
	__v: number;
}
export interface GetResourcesRequest {
	type?: string;
	instance?: string;
	sortBy?: string;
	sortDir?: string;
	search?: string;
	orgId: string;
}
export interface GetResourceRequest {
	iid: string;
	orgId: string;
}
export interface Instance {
	id: string;
	name: string;
	icon: React.ElementType;
	isConnectOnly?: boolean;
}

export enum ResourceType {
	Database = 'database',
	Cache = 'cache',
	Storage = 'storage',
	Queue = 'queue',
	Scheduler = 'scheduler',
	Realtime = 'realtime',
	Engine = 'engine',
}

export enum ResourceInstances {
	MySQL = 'MySQL',
	PostgreSQL = 'PostgreSQL',
	MongoDB = 'MongoDB',
	Redis = 'Redis',
	MinIO = 'MinIO',
	RabbitMQ = 'RabbitMQ',
	Kafka = 'Kafka',
	AWSS3 = 'AWS S3',
	AzureBlob = 'Azure Blob Storage',
	GCPStorage = 'GCP Cloud Storage',
	SQLServer = 'SQL Server',
}

export const AccessDbSchema = z
	.object({
		host: z.string().optional(),
		port: z.coerce
			.number()
			.int()
			.min(0, {
				message: translate('forms.invalid', { label: translate('resources.database.port') }),
			})
			.max(65535, {
				message: translate('forms.invalid', { label: translate('resources.database.port') }),
			})
			.optional(),
		username: z.string().optional(),
		password: z.string().optional(),
		encrypt: z.boolean().default(false).optional(),
		options: z
			.array(
				z
					.object({
						key: z.string().optional().or(z.literal('')),
						value: z.string().optional().or(z.literal('')),
					})
					.superRefine((val, ctx) => {
						const { key, value } = val;
						if (key && !value) {
							return ctx.addIssue({
								code: z.ZodIssueCode.custom,
								message: translate('forms.required', {
									label: translate('resources.database.key'),
								}),
							});
						}
						if (!key && value) {
							return ctx.addIssue({
								code: z.ZodIssueCode.custom,
								message: translate('forms.required', {
									label: translate('resources.database.value'),
								}),
							});
						}
					}),
			)
			.optional(),
		connFormat: z.nativeEnum(MongoDBConnFormat).default(MongoDBConnFormat.MongoDB).optional(),
		brokers: z
			.array(
				z.object({
					key: z.string().optional().or(z.literal('')),
				}),
			)
			.optional(),
		format: z.custom<RabbitMQConnFormat | KafkaConnFormat>().optional(),
		url: z.string().optional(),
		vhost: z.string().optional(),
		scheme: z.nativeEnum(RabbitMQConnScheme).default(RabbitMQConnScheme.AMQP).optional(),
		clientId: z.string().optional(),
		ssl: z
			.object({
				rejectUnauthorized: z.boolean().default(false).optional(),
				ca: z.string().optional(),
				key: z.string().optional(),
				cert: z.string().optional(),
			})
			.optional(),
		sasl: z
			.object({
				mechanism: z.nativeEnum(KafkaSaslMechanism).default(KafkaSaslMechanism.Plain).optional(),
				username: z.string().optional(),
				password: z.string().optional(),
			})
			.optional(),
		accessKeyId: z.string().optional(),
		secretAccessKey: z.string().optional(),
		region: z.string().optional(),
		connectionString: z.string().optional(),
		projectId: z.string().optional(),
		keyFileContents: z.string().optional(),
		dbNumber: z.coerce.number().int().optional(),
	})
	.superRefine((val, ctx) => {
		const { resourceConfig } = useResourceStore.getState();
		if (
			!val.host &&
			resourceConfig.resourceType !== ResourceType.Storage &&
			resourceConfig.type !== ResourceType.Queue &&
			val.format !== RabbitMQConnFormat.URL
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: translate('forms.required', {
					label: translate('resources.database.host'),
				}),
				path: ['host'],
			});
		}
		if (
			!val.port &&
			resourceConfig.resourceType !== ResourceType.Storage &&
			resourceConfig.type !== ResourceType.Queue &&
			val.format !== RabbitMQConnFormat.URL
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: translate('forms.required', {
					label: translate('resources.database.port'),
				}),
				path: ['port'],
			});
		}

		if (
			!val.username &&
			(resourceConfig.resourceType === ResourceType.Database ||
				val.format === RabbitMQConnFormat.Object)
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: translate('forms.required', {
					label: translate('resources.database.username'),
				}),
				path: ['username'],
			});
		}
		if (
			!val.password &&
			(resourceConfig.resourceType === ResourceType.Database ||
				val.format === RabbitMQConnFormat.Object)
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: translate('forms.required', {
					label: translate('resources.database.password'),
				}),
				path: ['password'],
			});
		}

		if (!val.format && resourceConfig.resourceType === ResourceType.Queue) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: translate('forms.required', {
					label: translate('resources.database.selectConnFormat'),
				}),
				path: ['format'],
			});
		}
		if (val.format === 'object' && resourceConfig.instance === ResourceInstances.RabbitMQ) {
			if (!val.scheme) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: translate('forms.required', {
						label: translate('resources.queue.scheme'),
					}),
					path: ['scheme'],
				});
			}
			if (!val.host) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: translate('forms.required', {
						label: translate('resources.database.host'),
					}),
					path: ['host'],
				});
			}
			if (!val.port) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: translate('forms.required', {
						label: translate('resources.database.port'),
					}),
					path: ['port'],
				});
			}

			if (!val.username) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: translate('forms.required', {
						label: translate('resources.database.username'),
					}),
					path: ['username'],
				});
			}
			if (!val.password) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: translate('forms.required', {
						label: translate('resources.database.password'),
					}),
					path: ['password'],
				});
			}
		}
		if (
			!val.url &&
			resourceConfig.instance === ResourceInstances.RabbitMQ &&
			val.format === 'url'
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: translate('forms.required', {
					label: translate('resources.queue.url'),
				}),
				path: ['url'],
			});
		}

		if (resourceConfig.instance === ResourceInstances.Kafka && val.format === 'ssl') {
			if (!val.ssl?.key) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: translate('forms.required', {
						label: translate('resources.queue.publicKey'),
					}),
					path: ['ssl', 'key'],
				});
			}
			if (!val.ssl?.cert) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: translate('forms.required', {
						label: translate('resources.queue.certificate'),
					}),
					path: ['ssl', 'cert'],
				});
			}
			if (!val.ssl?.ca) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: translate('forms.required', {
						label: translate('resources.queue.ca'),
					}),
					path: ['ssl', 'ca'],
				});
			}
		}
		if (val.format === 'sasl' && resourceConfig.instance === ResourceInstances.Kafka) {
			if (!val.sasl?.mechanism) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: translate('forms.required', {
						label: translate('resources.queue.mechanism'),
					}),
					path: ['sasl', 'mechanism'],
				});
			}
			if (!val.sasl?.username) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: translate('forms.required', {
						label: translate('resources.database.username'),
					}),
					path: ['sasl', 'username'],
				});
			}
			if (!val.sasl?.password) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: translate('forms.required', {
						label: translate('resources.database.password'),
					}),
					path: ['sasl', 'password'],
				});
			}
		}
		if (resourceConfig.resourceType === ResourceType.Storage) {
			if (resourceConfig.instance === ResourceInstances.AWSS3) {
				if (!val.accessKeyId) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: translate('forms.required', {
							label: translate('resources.storage.aws.accessKeyId'),
						}),
						path: ['accessKeyId'],
					});
				}

				if (!val.secretAccessKey) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: translate('forms.required', {
							label: translate('resources.storage.aws.secretAccessKey'),
						}),
						path: ['secretAccessKey'],
					});
				}
				if (!val.region) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: translate('forms.required', {
							label: translate('resources.storage.aws.region'),
						}),
						path: ['region'],
					});
				}
			}
			if (resourceConfig.instance === ResourceInstances.AzureBlob) {
				if (!val.connectionString) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: translate('forms.required', {
							label: translate('resources.storage.azure.connectionString'),
						}),
						path: ['connectionString'],
					});
				}
			}

			if (resourceConfig.instance === ResourceInstances.GCPStorage) {
				if (!val.projectId) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: translate('forms.required', {
							label: translate('resources.storage.gcp.projectId'),
						}),
						path: ['projectId'],
					});
				}
				if (!val.keyFileContents) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: translate('forms.required', {
							label: translate('resources.storage.gcp.keyFileContents'),
						}),
						path: ['keyFileContents'],
					});
				}
			}
		}
	});

export const ConnectResourceSchema = z.object({
	name: ResourceNameSchema,
	instance: z
		.string({
			required_error: translate('forms.required', {
				label: translate('resources.database.instance'),
			}),
		})
		.refine(
			(value) =>
				useTypeStore.getState().instanceTypes.database.includes(value) ||
				useTypeStore.getState().instanceTypes.storage.includes(value) ||
				useTypeStore.getState().instanceTypes.cache.includes(value) ||
				useTypeStore.getState().instanceTypes.queue.includes(value),
			{
				message: translate('forms.invalid', {
					label: translate('resources.database.instance'),
				}),
			},
		),
	allowedRoles: z.nativeEnum(AllowedRole).array(),
	type: z.nativeEnum(ResourceType),
	access: AccessDbSchema,
	accessReadOnly: z.array(AccessDbSchema).optional(),
});

export const CreateResourceSchema = ConnectResourceSchema.omit({
	access: true,
})
	.extend({
		config: z.object({
			size: z
				.string({
					required_error: translate('forms.required', {
						label: translate('resources.database.storage_size'),
					}),
				})
				.regex(MEMORY_REGEX, {
					message: translate('forms.invalidSize'),
				}),
			instances: z.coerce.number().min(1).optional(),
			replicas: z.coerce.number().min(1).optional(),
			version: z.string({
				required_error: translate('forms.required', {
					label: translate('resources.version'),
				}),
			}),
			readReplica: z.boolean().optional().default(false),
		}),
	})
	.superRefine((data, ctx) => {
		if (
			(data.instance === ResourceInstances.MongoDB ||
				data.instance === ResourceInstances.RabbitMQ) &&
			!data.config.replicas
		) {
			return ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: translate('forms.required', {
					label: translate('resources.database.replicas'),
				}),
				path: ['config', 'replicas'],
			});
		} else if (
			!data.config.instances &&
			!(
				data.instance === ResourceInstances.MongoDB || data.instance === ResourceInstances.RabbitMQ
			) &&
			data.instance !== ResourceInstances.Redis
		) {
			return ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: translate('forms.required', {
					label: translate('resources.database.instances'),
				}),
				path: ['config', 'instances'],
			});
		}
	});
export interface AddExistingResourceRequest extends BaseRequest {
	name?: string;
	type: ResourceType;
	instance: string;
	allowedRoles: string[];
	access: ResourceAccess;
	orgId: string;
}

export interface CreateResourceRequest extends BaseRequest {
	orgId: string;
	name: string;
	type: ResourceType;
	instance: string;
	allowedRoles: AllowedRole[];
	config: {
		version: string;
		size: string;
		instances?: number;
		replicas?: number;
	};
}
export interface UpdateResourceAllowedRolesRequest extends BaseRequest {
	resourceId: string;
	allowedRoles: AllowedRole[];
	name: string;
	orgId: string;
}
export interface UpdateResourceAccessSettingsRequest extends BaseRequest {
	resourceId: string;
	access: ResourceAccess;
	orgId: string;
}
export interface UpdateManagedResourceConfigurationRequest
	extends Omit<CreateResourceRequest, 'name' | 'allowedRoles'> {
	resourceId: string;
	updateType?: 'size' | 'others';
	orgId: string;
}

export interface DeleteResourceRequest {
	resourceId: string;
	orgId: string;
}

export enum ResourceUpdateType {
	Size = 'size',
	Others = 'others',
}
export interface RestartManagedResourceRequest {
	resourceId: string;
	orgId: string;
}
