import { SettingsFormItem } from '@/components/SettingsFormItem';
import { TransferOwnership } from '@/components/TransferOwnership';
import useAuthStore from '@/store/auth/authStore';
import useProjectStore from '@/store/project/projectStore';
import { useTranslation } from 'react-i18next';

export default function TransferProject() {
	const { t } = useTranslation();
	const user = useAuthStore((state) => state.user);
	const { transferProjectOwnership, project } = useProjectStore();
	return (
		<SettingsFormItem
			contentClassName='space-y-3'
			title={t('project.transfer')}
			description={t('project.transfer_desc')}
		>
			<TransferOwnership
				transferFn={transferProjectOwnership}
				type='app'
				disabled={project?.ownerUserId !== user._id}
			/>
		</SettingsFormItem>
	);
}
