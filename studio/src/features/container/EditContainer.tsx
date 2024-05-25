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
import { ContainerSchema, ContainerType, CreateContainerParams } from '@/types/container';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import CronJobFrom from './CreateForms/CronJobFrom';
import DeploymentForm from './CreateForms/DeploymentForm';
import KnativeForm from './CreateForms/KnativeForm';
import StatefulForm from './CreateForms/StatefulForm';
import { useEffect } from 'react';
import { OrganizationMenuItem } from '../organization';
import { EDIT_CONTAINER_TABS } from '@/constants';
import { useSearchParams } from 'react-router-dom';
import { Builds, Events, Logs, Pods, Variables } from './config';
import { useMutation } from '@tanstack/react-query';
import { Warning } from '@phosphor-icons/react';
import { cn } from '@/utils';

export default function EditContainer() {
	const { t } = useTranslation();
	const { isEditContainerDialogOpen, container, closeEditContainerDialog, updateContainer } =
		useContainerStore();
	const [searchParams, setSearchParams] = useSearchParams();
	const form = useForm<CreateContainerParams>({
		resolver: zodResolver(ContainerSchema),
	});

	const { mutateAsync: createContainerHandler, isPending } = useMutation({
		mutationFn: updateContainer,
		onSuccess: onClose,
		onError: (error) => {
			console.error(error);
		},
	});
	const onSubmit = (data: CreateContainerParams) => {
		localStorage.removeItem('createDeployment');
		createContainerHandler({
			...data,
			containerId: container?._id,
		});
	};

	function onClose() {
		form.reset();
		searchParams.delete('access_token');
		searchParams.delete('action');
		searchParams.delete('status');
		searchParams.delete('t');
		localStorage.removeItem('createDeployment');
		setSearchParams(searchParams);
		closeEditContainerDialog();
	}

	useEffect(() => {
		if (container) {
			form.reset({
				...container,
				envId: container.environmentId,
			});
		}
	}, [container]);

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
				<ul className='flex border-b'>
					{EDIT_CONTAINER_TABS.map((item) => {
						return (
							<OrganizationMenuItem
								key={item.name}
								item={item}
								active={window.location.search.includes(item.href)}
							/>
						);
					})}
				</ul>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className='overflow-auto flex-1 flex flex-col'
					>
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
									{ContainerType.KNativeService === container?.type && <KnativeForm />}
									{ContainerType.CronJob === container?.type && <CronJobFrom />}
								</>
							)}

							{searchParams.get('t') === 'variables' && <Variables />}
							{searchParams.get('t') === 'builds' && <Builds />}
							{searchParams.get('t') === 'pods' && <Pods />}
							{searchParams.get('t') === 'logs' && <Logs />}
							{searchParams.get('t') === 'events' && <Events />}
						</div>

						<DrawerFooter className='p-6 bg-subtle border-t flex-row justify-between'>
							<div className='flex items-center gap-2 text-yellow-500'>
								{form.formState.isDirty && (
									<>
										<Warning className='size-5' />
										<p className='text-sm font-sfCompact'>{t('container.unsaved_changes')}</p>
									</>
								)}
							</div>
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
									disabled={!form.formState.isDirty}
								>
									{t('general.save')}
								</Button>
							</div>
						</DrawerFooter>
					</form>
				</Form>
			</DrawerContent>
		</Drawer>
	);
}
