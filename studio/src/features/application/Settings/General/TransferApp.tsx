import { SettingsFormItem } from '@/components/SettingsFormItem';
import { TransferOwnership } from '@/components/TransferOwnership';
import useApplicationStore from '@/store/app/applicationStore';
import useAuthStore from '@/store/auth/authStore';
import { useTranslation } from 'react-i18next';

export default function TransferApp() {
	const { t } = useTranslation();
	const { transferAppOwnership, application } = useApplicationStore();
	const user = useAuthStore((state) => state.user);
	return (
		<SettingsFormItem
			contentClassName='space-y-3'
			title={t('application.edit.transfer.title')}
			description={t('application.edit.transfer.description')}
		>
			<span className='text-sm text-subtle font-normal leading-6'>
				{t('application.edit.transfer.subDesc')}
			</span>
			<TransferOwnership
				transferFn={transferAppOwnership}
				type='app'
				disabled={application?.ownerUserId !== user._id}
			/>
		</SettingsFormItem>
	);
}
