import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { TestConnectionButton } from '@/features/resources';
import { useToast } from '@/hooks';
import useCreateResource from '@/hooks/useCreateResource';
import useResourceStore from '@/store/resources/resourceStore';
import { ConnectResourceSchema } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { isEmpty } from 'lodash';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import * as z from 'zod';

export default function UpdateResourceAccessConf() {
	const { CurrentResourceElement } = useCreateResource();
	const form = useForm<z.infer<typeof ConnectResourceSchema>>({
		resolver: zodResolver(ConnectResourceSchema),
	});
	const { toast } = useToast();
	const { resourceToEdit, updateResourceAccessSettings, closeEditResourceModal } =
		useResourceStore();
	const { orgId } = useParams() as Record<string, string>;
	useEffect(() => {
		if (!isEmpty(resourceToEdit)) {
			form.reset({
				...resourceToEdit,
				access: {
					...resourceToEdit.access,
					...(!!resourceToEdit?.access?.options?.length && {
						options: resourceToEdit.access?.options?.filter((option) => option.key && option.value),
					}),
					brokers: resourceToEdit.access?.brokers?.map((broker) => ({
						key: broker,
					})),
				},
			});
		}
	}, [resourceToEdit]);
	const { mutate, isPending } = useMutation({
		mutationFn: async (data: z.infer<typeof ConnectResourceSchema>) => {
			return updateResourceAccessSettings({
				...data,
				orgId,
				access: {
					...data.access,
					options: data.access?.options?.filter((option) => option.key && option.value),
					brokers: data.access?.brokers?.map((broker) => broker.key) as string[],
				},
				resourceId: resourceToEdit?._id,
			});
		},
		onSuccess: () => {
			form.reset();
			closeEditResourceModal();
		},
		onError: ({ details }) => {
			toast({
				title: details,
				action: 'error',
			});
		},
	});

	function onSubmit(data: z.infer<typeof ConnectResourceSchema>) {
		mutate(data);
	}

	return (
		<Form {...form}>
			<form className='space-y-8 ' onSubmit={form.handleSubmit(onSubmit)}>
				<CurrentResourceElement />
				<div className='flex justify-between'>
					<TestConnectionButton />
					<Button type='submit' className='self-end' loading={isPending} size='lg'>
						{t('general.save')}
					</Button>
				</div>
			</form>
		</Form>
	);
}
