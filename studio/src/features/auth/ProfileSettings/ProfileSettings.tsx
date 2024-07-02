import { useTranslation } from 'react-i18next';
import useAuthStore from '@/store/auth/authStore.ts';
import { CopyInput } from '@/components/CopyInput';
import { ChangeName } from '@/features/auth/ChangeName';
import { DeleteAccount } from '@/features/auth/DeleteAccount';
import { ChangeUserAvatar } from '@/features/auth/ChangeAvatar';
import { ReactNode } from 'react';
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from '@/components/Drawer';
import { DropdownMenuItem } from '@/components/Dropdown';
import { cn } from '@/utils';
import { GearSix } from '@phosphor-icons/react';
import { Notifications } from '../Notifications';

interface SettingsFormItemProps {
	title: string;
	description?: string | null;
	children?: ReactNode;
}

export default function ProfileSettingsForm() {
	const { t } = useTranslation();
	const { user } = useAuthStore();

	return (
		<Drawer>
			<DrawerTrigger className='dropdown-item'>
				<div className={cn('flex items-center gap-2')}>
					<GearSix className='text-icon-base text-lg' />
					{t('general.account_settings')}
				</div>
			</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>{t('profileSettings.title')}</DrawerTitle>
				</DrawerHeader>
				<div className='p-6 divide-y  scroll'>
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
						title={t('profileSettings.your_avatar')}
						description={t('profileSettings.your_avatar_description')}
					>
						<ChangeUserAvatar />
					</ProfileSettingsFormItem>
					<ProfileSettingsFormItem
						title={t('profileSettings.notifications_title')}
						description={t('profileSettings.notifications_description')}
					>
						<Notifications />
					</ProfileSettingsFormItem>
					<ProfileSettingsFormItem
						title={t('profileSettings.delete_account')}
						description={t('profileSettings.delete_account_description')}
					>
						<DeleteAccount />
					</ProfileSettingsFormItem>
				</div>
			</DrawerContent>
		</Drawer>
	);
}

function ProfileSettingsFormItem({ title, description, children }: SettingsFormItemProps) {
	return (
		<div className='py-8 max-w-2xl first:pt-0 space-y-6'>
			<div>
				<div className='text-sm leading-6 text-default tracking-tight font-medium'>{title}</div>
				{description && (
					<p className='text-subtle text-sm tracking-tight font-normal'>{description}</p>
				)}
			</div>
			<div>{children}</div>
		</div>
	);
}
