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
import { EDIT_CONTAINER_TABS } from '@/constants';
import { useToast } from '@/hooks';
import useContainerStore from '@/store/container/containerStore';
import { Container, ContainerSchema, ContainerType, CreateContainerParams } from '@/types';
import { cn } from '@/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { Warning } from '@phosphor-icons/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { useEffect, useMemo } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { OrganizationMenuItem } from '../organization';
import { Builds, Events, Logs, Pods, Variables } from './config';
import CronJobForm from './CreateForms/CronJobFrom';
import DeploymentForm from './CreateForms/DeploymentForm';
import StatefulForm from './CreateForms/StatefulForm';

export default function EditContainer() {
	const { t } = useTranslation();
	const { toast } = useToast();

	const {
		isEditContainerDialogOpen,
		container,
		closeEditContainerDialog,
		updateContainer,
		getContainerTemplate,
	} = useContainerStore();
	const [searchParams, setSearchParams] = useSearchParams();
	const form = useForm<CreateContainerParams>({
		resolver: zodResolver(ContainerSchema),
	});
	const { mutateAsync: createContainerHandler, isPending } = useMutation({
		mutationFn: updateContainer,
		onSuccess: onClose,
		onError: (error: any) => {
			toast({
				action: 'error',
				title: error.details,
			});
		},
	});

	const onSubmit = (data: CreateContainerParams) => {
		localStorage.removeItem('createDeployment');
		createContainerHandler({
			...data,
			containerId: container?._id ?? '',
		});
	};

	function onClose() {
		form.reset({});
		setSearchParams({});
		closeEditContainerDialog();
	}

	const { data: template } = useQuery({
		queryKey: ['getContainerTemplate', container?.template?.name, container?.template?.version],
		queryFn: async () => {
			return getContainerTemplate(container?.template?.name!, container?.template?.version!);
		},
		enabled: isEditContainerDialogOpen && !!container?.template,
	});

	const tabs = useMemo(() => {
		if (!_.isEmpty(container?.template) || container?.repoOrRegistry === 'registry') {
			return EDIT_CONTAINER_TABS.filter((tab) => tab.href !== 'builds');
		}
		return EDIT_CONTAINER_TABS;
	}, [template]);

	useEffect(() => {
		if (container) {
			form.reset({
				...container,
				envId: container.environmentId,
				template,
			});
		}
	}, [container, template]);

	useEffect(() => {
		if (isEditContainerDialogOpen) {
			searchParams.set('t', 'settings');
			setSearchParams(searchParams);
		}
	}, [isEditContainerDialogOpen]);

	useEffect(() => {
		const storedData = localStorage.getItem('createDeployment');
		if (isEditContainerDialogOpen && storedData) {
			form.reset({
				...JSON.parse(storedData),
				type: container?.type,
				orgId: container?.orgId,
				projectId: container?.projectId,
				envId: container?.environmentId,
			});
		}
	}, [isEditContainerDialogOpen]);

	return (
		<Drawer open={isEditContainerDialogOpen} onOpenChange={onClose}>
			<DrawerContent position='right' size='lg' className='h-full flex flex-col'>
				<DrawerHeader className='border-none'>
					<DrawerTitle>
						{t('container.edit', {
							name: container?.name,
						})}
					</DrawerTitle>
				</DrawerHeader>
				<ContainerTabs tabs={tabs} />
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className='overflow-auto flex-1 flex flex-col'
					>
						<ContainerContent container={container!} />
						<DrawerFooter className='p-6 bg-subtle border-t flex-row justify-between'>
							<UnsavedChangesWarning formState={form.formState} />
							<ActionButtons formState={form.formState} isPending={isPending} />
						</DrawerFooter>
					</form>
				</Form>
			</DrawerContent>
		</Drawer>
	);
}

type ContainerTabsProps = {
	tabs: typeof EDIT_CONTAINER_TABS;
};

const ContainerTabs: React.FC<ContainerTabsProps> = ({ tabs }) => {
	return (
		<ul className='flex border-b'>
			{tabs.map((item) => (
				<OrganizationMenuItem
					key={item.name}
					item={item}
					active={window.location.search.includes(item.href)}
				/>
			))}
		</ul>
	);
};

type ContainerContentProps = {
	container: Container; // replace with your actual type
};

const ContainerContent: React.FC<ContainerContentProps> = ({ container }) => {
	const [searchParams] = useSearchParams();
	return (
		<div
			className={cn(
				'space-y-4 flex-1 overflow-auto',
				searchParams.get('t') === 'builds' ? 'px-6 pt-6 pb-1' : 'p-6',
			)}
		>
			{searchParams.get('t') === 'settings' && (
				<>
					{ContainerType.Deployment === container?.type && <DeploymentForm />}
					{ContainerType.StatefulSet === container?.type && <StatefulForm />}
					{ContainerType.CronJob === container?.type && <CronJobForm />}
				</>
			)}
			{searchParams.get('t') === 'variables' && <Variables />}
			{searchParams.get('t') === 'builds' && <Builds />}
			{searchParams.get('t') === 'pods' && <Pods />}
			{searchParams.get('t') === 'logs' && <Logs />}
			{searchParams.get('t') === 'events' && <Events />}
		</div>
	);
};

type UnsavedChangesWarningProps = {
	formState: UseFormReturn<CreateContainerParams>['formState'];
};

const UnsavedChangesWarning: React.FC<UnsavedChangesWarningProps> = ({ formState }) => {
	const { t } = useTranslation();
	return (
		<div className='flex items-center gap-2 text-yellow-500'>
			{formState.isDirty && (
				<>
					<Warning className='size-5' />
					<p className='text-sm '>{t('container.unsaved_changes')}</p>
				</>
			)}
		</div>
	);
};

type ActionButtonsProps = {
	formState: UseFormReturn<CreateContainerParams>['formState'];
	isPending: boolean;
};

const ActionButtons: React.FC<ActionButtonsProps> = ({ formState, isPending }) => {
	const { t } = useTranslation();
	return (
		<div>
			<DrawerClose asChild>
				<Button variant='secondary' size='lg'>
					{t('general.cancel')}
				</Button>
			</DrawerClose>
			<Button
				className='ml-2'
				type='submit'
				size='lg'
				loading={isPending}
				disabled={!formState.isDirty}
			>
				{t('general.save')}
			</Button>
		</div>
	);
};
