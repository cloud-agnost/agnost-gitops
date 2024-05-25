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
import { Textarea } from '@/components/Input';
import { ErrorPage } from '@/components/icons';
import { toast } from '@/hooks/useToast';
import useAuthStore from '@/store/auth/authStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useRouteError } from 'react-router-dom';
import * as z from 'zod';
const ErrorScheme = z.object({
	description: z.string({
		required_error: 'Description is required',
	}),
});

export default function Error({ children }: { children: React.ReactNode }) {
	const { t } = useTranslation();
	const error = useRouteError() as Error;
	const [isOpen, setIsOpen] = useState(false);
	const form = useForm<z.infer<typeof ErrorScheme>>({
		resolver: zodResolver(ErrorScheme),
	});
	const user = useAuthStore((state) => state.user);
	console.error(error);
	const { isPending, mutate } = useMutation({
		mutationFn: (data: z.infer<typeof ErrorScheme>) => {
			const myHeaders = new Headers();
			myHeaders.append('Content-Type', 'application/json');

			return fetch('https://cloudflex.app/env-ikqshrg70v97/bug', {
				method: 'POST',
				headers: myHeaders,
				body: JSON.stringify({
					...data,
					username: user.name,
					email: user.contactEmail,
					stack: error?.stack,
				}),
			});
		},
		onSuccess: () => {
			toast({
				title: 'Feedback sent',
				action: 'success',
			});
			form.reset();
			document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
		},
	});
	function onSubmit(data: z.infer<typeof ErrorScheme>) {
		mutate(data);
	}
	function closeModal() {
		setIsOpen(false);
		form.reset();
	}

	return (
		<div className='w-full h-screen flex flex-col items-center justify-center'>
			<div className='flex flex-col items-center space-y-2'>
				<ErrorPage className='w-16 h-16' />
				<h2 className='text-default text-sm font-semibold'>{t('general.internalServerError')}</h2>
				<p className='text-xs text-subtle font-sfCompact'>{t('general.errorPageDescription')}</p>
				<p className='text-xs text-subtle font-sfCompact'>
					{t('general.internalServerErrorDescription')}
				</p>
			</div>

			<div className='flex items-center'>
				{children}
				<Button className='mt-8 ml-2' variant='secondary' onClick={() => setIsOpen(true)}>
					{t('general.messageUs')}
				</Button>
			</div>
			<Dialog open={isOpen} onOpenChange={() => setIsOpen(false)}>
				<DialogContent>
					<DialogTitle>Report a bug</DialogTitle>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className='organization-form'>
							<FormField
								control={form.control}
								name='description'
								render={({ field }) => (
									<FormItem className='application-form-item'>
										<FormLabel>Description</FormLabel>
										<FormControl>
											<Textarea
												error={Boolean(form.formState.errors.description)}
												placeholder={t('forms.placeholder', {
													label: 'Description',
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
								<Button variant='text' onClick={closeModal}>
									{t('general.cancel')}
								</Button>
								<Button variant='primary' loading={isPending} type='submit'>
									{t('general.ok')}
								</Button>
							</div>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
