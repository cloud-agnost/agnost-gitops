import { ChangeAvatar } from '@/components/ChangeAvatar';
import { SettingsFormItem } from '@/components/SettingsFormItem';
import useProjectStore from '@/store/project/projectStore';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

export default function ChangeProjectAvatar() {
	const { t } = useTranslation();
	const { project, setProjectAvatar, removeProjectAvatar } = useProjectStore();
	const { orgId } = useParams() as Record<string, string>;
	const {
		isPending: changeAvatarLoading,
		mutateAsync: onChangeHandler,
		error: changeAvatarError,
	} = useMutation({
		mutationFn: (file: File) =>
			setProjectAvatar({
				orgId,
				projectId: project?._id as string,
				picture: file,
			}),
	});

	const {
		isPending: removeAvatarLoading,
		mutateAsync: removeHandler,
		error: removeAvatarError,
	} = useMutation({
		mutationFn: () => removeProjectAvatar({ orgId, projectId: project?._id as string }),
	});

	return (
		<SettingsFormItem
			twoColumns
			title={t('project.avatar') as string}
			description={t('project.avatar_desc') as string}
		>
			<ChangeAvatar
				item={{
					name: project?.name as string,
					color: project?.color as string,
					pictureUrl: project?.pictureUrl as string,
					_id: project?._id as string,
				}}
				onChange={onChangeHandler}
				removeAvatar={removeHandler}
				error={changeAvatarError || removeAvatarError}
				loading={changeAvatarLoading || removeAvatarLoading}
				className='flex items-center gap-32'
			/>
		</SettingsFormItem>
	);
}
