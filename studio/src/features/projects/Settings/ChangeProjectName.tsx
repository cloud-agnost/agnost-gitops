import { ChangeNameForm } from '@/components/ChangeNameForm';
import { Form } from '@/components/Form';
import { SettingsFormItem } from '@/components/SettingsFormItem';
import { useToast } from '@/hooks';
import useAuthorizeProject from '@/hooks/useAuthorizeProject';
import useProjectStore from '@/store/project/projectStore';
import { ChangeNameFormSchema } from '@/types';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { z } from 'zod';

export default function ChangeProjectName() {
	const { t } = useTranslation();
	const { project, changeProjectName } = useProjectStore();
	const canEdit = useAuthorizeProject('update');
	const { toast } = useToast();
	const { orgId } = useParams() as Record<string, string>;
	const form = useForm<z.infer<typeof ChangeNameFormSchema>>({
		defaultValues: {
			name: project?.name as string,
		},
	});

	const {
		mutateAsync: changeNameMutate,
		isPending,
		error,
	} = useMutation({
		mutationFn: changeProjectName,
		onSuccess: () => {
			toast({
				title: t('project.edit_name_success') as string,
				action: 'success',
			});
		},
	});
	async function onSubmit(data: z.infer<typeof ChangeNameFormSchema>) {
		changeNameMutate({
			name: data.name,
			projectId: project?._id as string,
			orgId,
		});
	}
	return (
		<SettingsFormItem title={t('project.name')} description={t('project.name_desc')}>
			<Form {...form}>
				<form className='space-y-6' onSubmit={form.handleSubmit(onSubmit)}>
					<ChangeNameForm loading={isPending} error={error} disabled={!canEdit} />
				</form>
			</Form>
		</SettingsFormItem>
	);
}
