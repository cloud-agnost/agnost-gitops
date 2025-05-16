import { Button } from '@/components/Button';
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from '@/components/Drawer';
import { Form } from '@/components/Form';
import useContainerStore from '@/store/container/containerStore';
import { ContainerSchema, ContainerType, CreateContainerParams } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { startCase } from 'lodash';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useParams, useSearchParams } from 'react-router-dom';
import CronJobFrom from './CreateForms/CronJobFrom';
import DeploymentForm from './CreateForms/DeploymentForm';
import StatefulForm from './CreateForms/StatefulForm';
import { useToast } from '@/hooks';

const defaultValues: Partial<CreateContainerParams> = {
	repoOrRegistry: 'repo',
	//@ts-ignore
	repo: {
		type: 'github',
		dockerfile: 'Dockerfile',
		connected: true,
		path: '/',
		watchPath: '/',
	},
	podConfig: {
		cpuLimit: 1,
		cpuLimitType: 'cores',
		cpuRequest: 100,
		cpuRequestType: 'millicores',
		memoryLimit: 1,
		memoryLimitType: 'gibibyte',
		memoryRequest: 128,
		memoryRequestType: 'mebibyte',
		restartPolicy: 'Always',
	},
	probes: {
		startup: {
			enabled: false,
			checkMechanism: 'httpGet',
			httpPath: '/health',
			httpPort: 80,
			initialDelaySeconds: 30,
			periodSeconds: 30,
			timeoutSeconds: 10,
			failureThreshold: 3,
		},
		readiness: {
			enabled: false,
			httpPath: '/health',
			httpPort: 80,
			checkMechanism: 'httpGet',
			initialDelaySeconds: 30,
			periodSeconds: 30,
			timeoutSeconds: 10,
			failureThreshold: 3,
		},
		liveness: {
			enabled: false,
			httpPath: '/health',
			httpPort: 80,
			checkMechanism: 'httpGet',
			initialDelaySeconds: 30,
			periodSeconds: 30,
			timeoutSeconds: 10,
			failureThreshold: 3,
		},
	},
	storageConfig: {
		enabled: false,
		sizeType: 'gibibyte',
		accessModes: ['ReadWriteOnce'],
		size: 1,
	},
	orgId: '',
	projectId: '',
	envId: '',
	type: 'deployment',
	variables: [],
};

export default function CreateContainerDrawer() {
	const { t } = useTranslation();
	const { toast } = useToast();
	const {
		closeCreateContainerDialog,
		createContainer,
		isCreateContainerDialogOpen,
		createdContainerType,
		templates,
	} = useContainerStore();
	const { orgId, projectId, envId } = useParams() as Record<string, string>;
	const [searchParams, setSearchParams] = useSearchParams();
	const form = useForm<CreateContainerParams>({
		resolver: zodResolver(ContainerSchema),
		defaultValues,
	});
	const { mutateAsync: createContainerHandler, isPending } = useMutation({
		mutationFn: createContainer,
		onSuccess: () => {
			onClose();
		},
		onError: (error) => {
			toast({
				title: error.details,
				action: 'error',
			});
		},
	});
	const onSubmit = (data: CreateContainerParams) => {
		localStorage.removeItem('createDeployment');
		createContainerHandler({
			...data,
			//@ts-ignore
			template: {
				manifest: data.template?.manifest!,
				name: data.template?.name!,
				version: data.template?.version!,
			},
		});
	};

	function onClose() {
		form.reset({
			...defaultValues,
			type: createdContainerType!,
		});
		setSearchParams({});
		localStorage.removeItem('createDeployment');
		closeCreateContainerDialog();
	}
	useEffect(() => {
		if (isCreateContainerDialogOpen) {
			form.setValue('type', createdContainerType!);
			form.setValue('orgId', orgId);
			form.setValue('projectId', projectId);
			form.setValue('envId', envId);
		}
	}, [createdContainerType, isCreateContainerDialogOpen]);

	useEffect(() => {
		const storedData = localStorage.getItem('createDeployment');
		const templateName = searchParams.get('template');
		if (isCreateContainerDialogOpen) {
			if (storedData) {
				form.reset({
					...JSON.parse(storedData),
					type: createdContainerType!,
					orgId,
					projectId,
					envId,
				});
			}
			if (templateName) {
				const template = templates
					?.flatMap((t) => t.templates)
					.find((t) => t.name === templateName);
				const defaultValues = template?.config.defaultValues;
				if (template && defaultValues) {
					form.reset({
						template,
						type: template.type as ContainerType,
						orgId,
						projectId,
						envId,
						registry: {
							imageUrl: defaultValues['registry.imageUrl'],
						},
						networking: {
							containerPort: defaultValues['networking.containerPort'],
							tcpProxy: {
								enabled: defaultValues['networking.tcpProxy.enabled'],
							},
						},
						podConfig: {
							cpuLimit: defaultValues['podConfig.cpuLimit'],
							cpuLimitType: defaultValues['podConfig.cpuLimitType'],
							cpuRequest: defaultValues['podConfig.cpuRequest'],
							cpuRequestType: defaultValues['podConfig.cpuRequestType'],
							memoryLimit: defaultValues['podConfig.memoryLimit'],
							memoryLimitType: defaultValues['podConfig.memoryLimitType'],
							memoryRequest: defaultValues['podConfig.memoryRequest'],
							memoryRequestType: defaultValues['podConfig.memoryRequestType'],
							restartPolicy: defaultValues['podConfig.restartPolicy'],
						},
						probes: {
							liveness: {
								enabled: defaultValues['probes.liveness.enabled'],
							},
							readiness: {
								enabled: defaultValues['probes.readiness.enabled'],
							},
							startup: {
								enabled: defaultValues['probes.startup.enabled'],
							},
						},
						...(template.type === ContainerType.StatefulSet && {
							statefulSetConfig: {
								desiredReplicas: defaultValues['statefulSetConfig.desiredReplicas'],
								persistentVolumeClaimRetentionPolicy: {
									whenDeleted:
										defaultValues[
											'statefulSetConfig.persistentVolumeClaimRetentionPolicy.whenDeleted'
										],
									whenScaled:
										defaultValues[
											'statefulSetConfig.persistentVolumeClaimRetentionPolicy.whenScaled'
										],
								},
							},
						}),
						...(template.type === ContainerType.Deployment && {
							deploymentConfig: {
								desiredReplicas: defaultValues['deploymentConfig.desiredReplicas'],
								cpuMetric: {
									enabled: defaultValues['deploymentConfig.cpuMetric.enabled'],
								},
								memoryMetric: {
									enabled: defaultValues['deploymentConfig.memoryMetric.enabled'],
								},
							},
						}),
						storageConfig: {
							accessModes: defaultValues['storageConfig.accessModes'],
							enabled: defaultValues['storageConfig.enabled'],
							mountPath: defaultValues['storageConfig.mountPath'],
							size: defaultValues['storageConfig.size'],
							sizeType: defaultValues['storageConfig.sizeType'],
						},

						variables: Object.entries(template.config.variables).map(([name, value]) => ({
							name,
							value,
						})),
						repoOrRegistry: defaultValues['repoOrRegistry'],
					});
				}
			}
		}
	}, [isCreateContainerDialogOpen]);

	return (
		<Drawer open={isCreateContainerDialogOpen} onOpenChange={onClose}>
			<DrawerContent position='right' size='lg' className='h-full'>
				<DrawerHeader>
					<DrawerTitle>
						{!!form.watch('template.name')
							? t('container.create_container_from_template', {
									type: form.watch('template.name'),
								})
							: t('container.create', {
									type: startCase(createdContainerType!),
								})}
					</DrawerTitle>
				</DrawerHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='overflow-auto h-full'>
						<div className='p-6 scroll space-y-6 relative'>
							{ContainerType.Deployment === createdContainerType && <DeploymentForm />}
							{ContainerType.StatefulSet === createdContainerType && <StatefulForm />}
							{ContainerType.CronJob === createdContainerType && <CronJobFrom />}
						</div>

						<DrawerFooter className='p-6 bg-subtle border-t'>
							<DrawerClose asChild>
								<Button variant='secondary' size='lg'>
									{t('general.cancel')}
								</Button>
							</DrawerClose>
							<Button className='ml-2' type='submit' size='lg' loading={isPending}>
								{t('general.create')}
							</Button>
						</DrawerFooter>
					</form>
				</Form>
			</DrawerContent>
		</Drawer>
	);
}
