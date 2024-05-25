import { Button } from '@/components/Button';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from '@/components/Dialog';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/Form';
import { Input } from '@/components/Input';
import { useToast } from '@/hooks';
import useAuthorizeOrg from '@/hooks/useAuthorizeOrg';
import useProjectStore from '@/store/project/projectStore';
import { APIError, CreateApplicationSchema } from '@/types';
import { CreateProjectRequest, CreateProjectSchema } from '@/types/project';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import * as z from 'zod';

export default function CreateProject({ className }: { className?: string }) {
	const { createProject } = useProjectStore();
	const canProjectCreate = useAuthorizeOrg('project.create');
	const { t } = useTranslation();
	const form = useForm<CreateProjectRequest>({
		resolver: zodResolver(CreateProjectSchema),
	});
	const { toast } = useToast();
	const { orgId } = useParams<{
		orgId: string;
	}>();

	const { isPending, mutateAsync } = useMutation({
		mutationFn: createProject,
		onSuccess: () => {
			closeModal();
		},
		onError: (error: APIError) => {
			toast({
				title: error.details,
				action: 'error',
			});
			closeModal();
		},
	});
	async function onSubmit(data: z.infer<typeof CreateApplicationSchema>) {
		mutateAsync({
			...data,
			orgId,
		});
	}

	function closeModal() {
		form.reset();
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
	}

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant='primary' size='lg' disabled={!canProjectCreate} className={className}>
					<Plus size={14} className='mr-1 text-icon-default' />
					{t('project.create')}
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogTitle>{t('project.create')}</DialogTitle>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-2'>
						<FormField
							control={form.control}
							name='name'
							render={({ field }) => (
								<FormItem className='application-form-item'>
									<FormLabel>{t('project.name')}</FormLabel>
									<FormControl>
										<Input
											error={Boolean(form.formState.errors.name)}
											placeholder={t('forms.placeholder', {
												label: t('project.name'),
											}).toString()}
											{...field}
										/>
									</FormControl>
									<FormDescription>{t('forms.max64.description')}</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name='envName'
							render={({ field }) => (
								<FormItem className='application-form-item'>
									<FormLabel>{t('project.envName')}</FormLabel>
									<FormControl>
										<Input
											error={Boolean(form.formState.errors.name)}
											placeholder={t('forms.placeholder', {
												label: t('project.envName'),
											}).toString()}
											{...field}
										/>
									</FormControl>
									<FormDescription>{t('forms.max64.description')}</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className='flex justify-end gap-4 mt-2'>
							<DialogClose asChild>
								<Button variant='text' size='lg' onClick={closeModal} type='button'>
									{t('general.cancel')}
								</Button>
							</DialogClose>
							<Button variant='primary' size='lg' loading={isPending} type='submit'>
								{t('general.ok')}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
