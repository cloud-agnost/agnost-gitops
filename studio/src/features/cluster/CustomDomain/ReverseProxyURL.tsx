import { Button } from '@/components/Button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/Form';
import { Input } from '@/components/Input';
import { useToast } from '@/hooks';
import useClusterStore from '@/store/cluster/clusterStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import z from 'zod';

const ReverseProxyURLSchema = z.object({
	reverseProxyURL: z
		.string({
			required_error: 'Reverse Proxy URL is required',
		})
		.url({
			message: 'Invalid URL',
		})
		.or(z.literal('')),
});

export default function ReverseProxyURL() {
	const { cluster, setReverseProxyURL } = useClusterStore();
	const { t } = useTranslation();
	const { toast } = useToast();
	const form = useForm<z.infer<typeof ReverseProxyURLSchema>>({
		resolver: zodResolver(ReverseProxyURLSchema),
		defaultValues: {
			reverseProxyURL: cluster?.reverseProxyURL || '',
		},
	});

	const { mutate: setProxy, isPending } = useMutation({
		mutationFn: setReverseProxyURL,
		onSuccess: () => {
			toast({
				action: 'success',
				title: t('cluster.reverseProxyURLSuccess') as string,
			});
			document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
		},
		onError: (error) => {
			toast({
				action: 'error',
				title: error.details,
			});
		},
	});

	const onSubmit = (data: z.infer<typeof ReverseProxyURLSchema>) => {
		setProxy(data.reverseProxyURL);
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
				<FormField
					control={form.control}
					name='reverseProxyURL'
					render={({ field }) => (
						<FormItem className='flex-1'>
							<FormControl>
								<Input
									error={!!form.formState.errors.reverseProxyURL}
									placeholder={t('forms.placeholder', {
										label: t('cluster.domain.urlTitle'),
									}).toString()}
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<div className='flex justify-end'>
					<Button type='submit' size='lg' loading={isPending}>
						{t('general.save')}
					</Button>
				</div>
			</form>
		</Form>
	);
}
