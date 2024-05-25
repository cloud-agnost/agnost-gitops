import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from '@/components/Popover';
import { toast } from '@/hooks/useToast';
import useAuthStore from '@/store/auth/authStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lightbulb } from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import { Form, FormControl, FormField, FormItem, FormMessage } from 'components/Form';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';
import { Button } from '../Button';
import { Textarea } from '../Input';
const FeedbackScheme = z.object({
	feedback: z.string({
		required_error: 'Feedback is required',
	}),
});
export default function Feedback() {
	const { t } = useTranslation();
	const user = useAuthStore((state) => state.user);
	const form = useForm<z.infer<typeof FeedbackScheme>>({
		resolver: zodResolver(FeedbackScheme),
	});
	const { isPending, mutate } = useMutation({
		mutationFn: (data: z.infer<typeof FeedbackScheme>) => {
			const myHeaders = new Headers();
			myHeaders.append('Content-Type', 'application/json');

			return fetch('https://cloudflex.app/env-ikqshrg70v97/feedback', {
				method: 'POST',
				headers: myHeaders,
				body: JSON.stringify({
					...data,
					username: user.name,
					email: user.contactEmail,
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
	function onSubmit(data: z.infer<typeof FeedbackScheme>) {
		mutate(data);
	}

	return (
		<Popover
			onOpenChange={() => {
				form.reset();
			}}
		>
			<PopoverTrigger asChild>
				<Button
					variant='text'
					size='sm'
					className='header-menu-right-nav-item !text-subtle hover:!text-default'
				>
					<Lightbulb size={14} className='mr-1' />
					<span className='header-menu-right-nav-item-title font-sfCompact'>Feedback</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent align='start' className='p-4'>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className=' space-y-6'>
						<FormField
							control={form.control}
							name='feedback'
							render={({ field }) => (
								<FormItem>
									<FormControl>
										<Textarea
											error={!!form.formState.errors.feedback}
											rows={10}
											{...field}
											placeholder={
												t('forms.placeholder', {
													label: 'Feedback',
												}) ?? ''
											}
											className='h-32'
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className='flex items-center justify-end gap-2 border-t border-border'>
							<PopoverClose asChild>
								<Button variant='secondary' className='mr-2' size='lg'>
									{t('general.cancel')}
								</Button>
							</PopoverClose>

							<Button type='submit' size='lg' loading={isPending}>
								{t('general.ok')}
							</Button>
						</div>
					</form>
				</Form>
			</PopoverContent>
		</Popover>
	);
}
