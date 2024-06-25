import { Form } from '@/components/Form';
import { CreateResourceLayout } from '@/features/resources';
import { useToast } from '@/hooks';
import useCreateResource from '@/hooks/useCreateResource';
import useResourceStore from '@/store/resources/resourceStore';
import { ConnectResourceSchema } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import * as z from 'zod';
export default function ConnectResource() {
	const { toggleCreateResourceModal, addExistingResource } = useResourceStore();
	const { CurrentResourceElement } = useCreateResource();
	const { toast } = useToast();
	const form = useForm<z.infer<typeof ConnectResourceSchema>>({
		resolver: zodResolver(ConnectResourceSchema),
	});
	const { orgId } = useParams() as Record<string, string>;

	const { mutate, isPending: loading } = useMutation({
		mutationFn: addExistingResource,
		onSuccess: toggleCreateResourceModal,
		onError: (error: { details: string }) => {
			toast({
				title: error.details,
				action: 'error',
			});
		},
	});
	function onSubmit(data: z.infer<typeof ConnectResourceSchema>) {
		mutate({
			...data,
			orgId,
			access: {
				...data.access,
				options: data.access?.options?.filter((option) => option.key && option.value),
				brokers: data.access?.brokers?.map((broker) => broker.key) as string[],
			},
		});
	}
	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				<CreateResourceLayout loading={loading}>
					<CurrentResourceElement />
				</CreateResourceLayout>
			</form>
		</Form>
	);
}
