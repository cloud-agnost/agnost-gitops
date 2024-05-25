import { Alert, AlertDescription, AlertTitle } from '@/components/Alert';
import { ChangeNameForm } from '@/components/ChangeNameForm';
import { SettingsFormItem } from '@/components/SettingsFormItem';
import { useAuthorizeVersion, useUpdateEffect, useUpdateVersion } from '@/hooks';
import useVersionStore from '@/store/version/versionStore';
import { ChangeNameFormSchema } from '@/types';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Form } from '@/components/Form';
import { useForm } from 'react-hook-form';
export default function UpdateVersionName() {
	const { version } = useVersionStore();
	const { t } = useTranslation();
	const canEdit = useAuthorizeVersion('version.update');
	const { updateVersion, isPending, error } = useUpdateVersion();
	const form = useForm<z.infer<typeof ChangeNameFormSchema>>({
		defaultValues: {
			name: version?.name as string,
		},
	});
	async function onSubmit(data: z.infer<typeof ChangeNameFormSchema>) {
		if (version?.name === data.name) return;
		updateVersion({ name: data.name });
	}

	useUpdateEffect(() => {
		if (error) return;
		form.setValue('name', version?.name);
	}, [version?.name]);
	return (
		<SettingsFormItem
			className='space-y-0 py-6'
			contentClassName='pt-6'
			title={t('version.settings.version_name')}
			description={t('version.settings.version_name_desc')}
		>
			{error && (
				<Alert variant='error'>
					<AlertTitle>{error.error}</AlertTitle>
					<AlertDescription>{error.details}</AlertDescription>
				</Alert>
			)}
			<Form {...form}>
				<form className='space-y-6' onSubmit={form.handleSubmit(onSubmit)}>
					<ChangeNameForm loading={isPending} error={error} disabled={!canEdit} />
				</form>
			</Form>
		</SettingsFormItem>
	);
}
