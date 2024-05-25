import { ChangeNameForm } from '@/components/ChangeNameForm';
import { Form } from '@/components/Form';
import useAuthorizeOrg from '@/hooks/useAuthorizeOrg';
import useOrganizationStore from '@/store/organization/organizationStore';
import { ChangeNameFormSchema } from '@/types';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks';
export default function ChangeOrganizationName() {
	const { organization, changeOrganizationName } = useOrganizationStore();
	const canOrgUpdate = useAuthorizeOrg('update');
	const { toast } = useToast();
	const form = useForm<z.infer<typeof ChangeNameFormSchema>>({
		defaultValues: {
			name: organization?.name as string,
		},
	});

	const {
		mutateAsync: changeOrgNameMutate,
		isPending,
		error,
	} = useMutation({
		mutationFn: changeOrganizationName,
		onError: ({ details }) => {
			toast({ title: details, action: 'error' });
		},
		onSuccess: () => {
			toast({ title: 'Organization name updated', action: 'success' });
		},
	});

	async function onSubmit(data: z.infer<typeof ChangeNameFormSchema>) {
		changeOrgNameMutate({
			name: data.name,
			organizationId: organization?._id as string,
		});
	}

	return (
		<Form {...form}>
			<form className='space-y-6' onSubmit={form.handleSubmit(onSubmit)}>
				<ChangeNameForm loading={isPending} error={error} disabled={!canOrgUpdate} />
			</form>
		</Form>
	);
}
