import { ChangeAvatar } from '@/components/ChangeAvatar';
import useApplicationStore from '@/store/app/applicationStore';
import { APIError } from '@/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks';
import { useParams } from 'react-router-dom';
import { SettingsFormItem } from '@/components/SettingsFormItem';
export default function ChangeAppAvatar() {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<APIError | null>(null);
	const { application, setAppAvatar, removeAppAvatar } = useApplicationStore();
	const { orgId } = useParams() as Record<string, string>;
	const { toast } = useToast();
	async function onChangeHandler(file: File) {
		setLoading(true);
		setAppAvatar({
			orgId,
			appId: application?._id as string,
			picture: file,
			onSuccess: () => {
				setLoading(false);
			},
			onError: (error: APIError) => {
				setError(error);
				setLoading(false);
			},
		});
	}

	async function removeHandler() {
		setError(null);
		setLoading(true);
		removeAppAvatar({
			appId: application?._id as string,
			orgId,
			onSuccess: () => {
				setLoading(false);
				toast({
					title: t('application.edit.avatar.successDesc') as string,
					action: 'success',
				});
			},
			onError: (error: APIError) => {
				setError(error);
				setLoading(false);
			},
		});
	}

	return (
		<SettingsFormItem
			twoColumns
			title={t('application.edit.avatar.title') as string}
			description={t('application.edit.avatar.description') as string}
		>
			<ChangeAvatar
				item={{
					name: application?.name as string,
					color: application?.color as string,
					pictureUrl: application?.pictureUrl as string,
					_id: application?._id as string,
				}}
				onChange={onChangeHandler}
				removeAvatar={removeHandler}
				error={error}
				loading={loading}
				className='flex items-center gap-32'
			/>
		</SettingsFormItem>
	);
}
