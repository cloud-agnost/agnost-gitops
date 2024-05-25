import { Button } from '@/components/Button';
import { Dialog, DialogContent, DialogTitle } from '@/components/Dialog';
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
import useApplicationStore from '@/store/app/applicationStore.ts';
import useOrganizationStore from '@/store/organization/organizationStore';
import { APIError, CreateApplicationSchema } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';

interface ApplicationCreateModalProps {
	closeModal: () => void;
	isOpen: boolean;
}

export default function ApplicationCreateModal({
	closeModal,
	isOpen,
	...props
}: ApplicationCreateModalProps) {
	const { toast } = useToast();
	const form = useForm<z.infer<typeof CreateApplicationSchema>>({
		resolver: zodResolver(CreateApplicationSchema),
	});
	const { t } = useTranslation();
	const { organization } = useOrganizationStore();
	const { createApplication } = useApplicationStore();

	function handleCloseModal() {
		closeModal();
		form.reset();
	}

	const { isPending, mutateAsync: createApplicationMutate } = useMutation({
		mutationFn: createApplication,
		onSuccess: () => {
			handleCloseModal();
		},
		onError: (error: APIError) => {
			toast({
				title: error.details,
				action: 'error',
			});
			handleCloseModal();
		},
	});
	async function onSubmit(data: z.infer<typeof CreateApplicationSchema>) {
		createApplicationMutate({
			name: data.name,
			orgId: organization?._id as string,
		});
	}

	return (
		<Dialog open={isOpen} {...props} onOpenChange={closeModal}>
			<DialogContent>
				<DialogTitle>{t('application.create')}</DialogTitle>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className='organization-form'>
						<FormField
							control={form.control}
							name='name'
							render={({ field }) => (
								<FormItem className='application-form-item'>
									<FormLabel>{t('application.name')}</FormLabel>
									<FormControl>
										<Input
											error={Boolean(form.formState.errors.name)}
											placeholder={t('forms.placeholder', {
												label: t('application.name'),
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
							<Button variant='text' size='lg' onClick={closeModal} type='button'>
								{t('general.cancel')}
							</Button>
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
