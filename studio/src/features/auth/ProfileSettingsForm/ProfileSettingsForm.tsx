import { useTranslation } from 'react-i18next';
import useAuthStore from '@/store/auth/authStore.ts';
import { CopyInput } from 'components/CopyInput';
import { ChangeName } from '@/features/auth/ChangeName';
import { ChangeEmail } from '@/features/auth/ChangeEmail';
import { ChangePassword } from '@/features/auth/ChangePassword';
import { ProfileSettingsFormItem } from '@/features/auth/ProfileSettingsForm/index.ts';
import { DeleteAccount } from '@/features/auth/DeleteAccount';
import { ChangeUserAvatar } from '@/features/auth/ChangeAvatar';

export default function ProfileSettingsForm() {
	const { t } = useTranslation();
	const { user } = useAuthStore();

	return (
		<div className='divide-y last:border-b'>
			<ProfileSettingsFormItem
				title={t('profileSettings.your_user_id')}
				description={t('profileSettings.your_user_id_description')}
			>
				<CopyInput readOnly value={user?.iid} />
			</ProfileSettingsFormItem>
			<ProfileSettingsFormItem
				title={t('profileSettings.your_name')}
				description={t('profileSettings.your_name_description')}
			>
				<ChangeName />
			</ProfileSettingsFormItem>
			<ProfileSettingsFormItem
				title={t('profileSettings.your_email')}
				description={t('profileSettings.your_email_description')}
			>
				<ChangeEmail />
			</ProfileSettingsFormItem>

			<ProfileSettingsFormItem
				title={t('profileSettings.password')}
				description={t('profileSettings.your_password_description')}
			>
				<ChangePassword />
			</ProfileSettingsFormItem>
			<ProfileSettingsFormItem
				title={t('profileSettings.your_avatar')}
				description={t('profileSettings.your_avatar_description')}
			>
				<ChangeUserAvatar />
			</ProfileSettingsFormItem>

			<ProfileSettingsFormItem
				title={t('profileSettings.delete_account')}
				description={t('profileSettings.delete_account_description')}
			>
				<DeleteAccount />
			</ProfileSettingsFormItem>
		</div>
	);
}
