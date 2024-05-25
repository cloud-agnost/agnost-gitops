import { Button } from '@/components/Button';
import { useToast } from '@/hooks';
import useProjectEnvironmentStore from '@/store/project/projectEnvironmentStore';
import { APIError, CreateNewEnvironmentRequest } from '@/types';
import { CreateNewEnvironmentSchema, ProjectEnvironment } from '@/types/project-environment';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from 'components/Drawer';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from 'components/Form';
import { Input } from 'components/Input';
import { Switch } from 'components/Switch';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
export default function CreateEnvironment() {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const { isCreateEnvironmentDrawerOpen, createEnvironment, toggleCreateEnvironmentDrawer } =
		useProjectEnvironmentStore();
	const { projectId, orgId } = useParams() as Record<string, string>;
	const form = useForm<CreateNewEnvironmentRequest>({
		resolver: zodResolver(CreateNewEnvironmentSchema),
		defaultValues: {
			private: false,
			readOnly: false,
		},
	});
	const { toast } = useToast();
	const { mutate: createEnvironmentHandler, isPending } = useMutation({
		mutationFn: createEnvironment,
		onSuccess: (data: ProjectEnvironment) => {
			onClose();
			navigate(`/organization/${orgId}/projects/${projectId}/env/${data._id}`);
		},
		onError: (error: APIError) => {
			toast({
				action: 'error',
				title: error.details,
			});
		},
	});

	const onSubmit = (data: CreateNewEnvironmentRequest) => {
		createEnvironmentHandler({
			...data,
			projectId,
			orgId,
		});
	};

	function onClose() {
		form.reset();
		toggleCreateEnvironmentDrawer();
	}

	useEffect(() => {
		form.reset();
	}, [isCreateEnvironmentDrawerOpen]);

	return (
		<Drawer open={isCreateEnvironmentDrawerOpen} onOpenChange={onClose}>
			<DrawerContent position='right'>
				<DrawerHeader>
					<DrawerTitle>{t('project.create_env.title')}</DrawerTitle>
				</DrawerHeader>
				<Form {...form}>
					<form className='p-6 flex flex-col gap-6' onSubmit={form.handleSubmit(onSubmit)}>
						<FormField
							control={form.control}
							name='name'
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t('project.envName')}</FormLabel>
									<FormControl>
										<Input
											error={Boolean(form.formState.errors.name)}
											placeholder={
												t('forms.placeholder', {
													label: t('project.envName').toLowerCase(),
												}) ?? ''
											}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name='private'
							render={({ field }) => (
								<FormItem className='grid grid-cols-[2fr_1fr] items-center space-y-0 gap-2'>
									<div>
										<FormLabel>{t('version.private')}</FormLabel>
										<FormDescription>{t('project.create_env.private_desc')}</FormDescription>
									</div>
									<FormControl className='justify-self-end'>
										<Switch
											onBlur={field.onBlur}
											ref={field.ref}
											name={field.name}
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name='readOnly'
							render={({ field }) => (
								<FormItem className='grid grid-cols-[2fr_1fr] items-center space-y-0 gap-2'>
									<div>
										<FormLabel>{t('version.read_only')}</FormLabel>
										<FormDescription>{t('project.create_env.readonly_desc')}</FormDescription>
									</div>
									<FormControl className='justify-self-end'>
										<Switch
											onBlur={field.onBlur}
											ref={field.ref}
											name={field.name}
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className='flex gap-4 justify-end mt-4'>
							<DrawerClose asChild>
								<Button variant='secondary' size='lg'>
									{t('general.cancel')}
								</Button>
							</DrawerClose>
							<Button loading={isPending} size='lg' type='submit'>
								{t('general.add')}
							</Button>
						</div>
					</form>
				</Form>
			</DrawerContent>
		</Drawer>
	);
}
