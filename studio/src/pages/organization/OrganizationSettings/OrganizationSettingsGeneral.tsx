import { CopyInput } from '@/components/CopyInput';
import { SettingsFormItem } from '@/components/SettingsFormItem';
import {
	ChangeOrganizationAvatar,
	ChangeOrganizationName,
	DeleteOrganization,
	TransferOrganization,
} from '@/features/organization';
import { SettingsContainer } from '@/features/version/SettingsContainer';
import useOrganizationStore from '@/store/organization/organizationStore';
import { useTranslation } from 'react-i18next';
export default function OrganizationSettingsGeneral() {
	const { t } = useTranslation();
	const { organization } = useOrganizationStore();
	const ORGANIZATION_GENERAL_SETTINGS = [
		{
			title: t('organization.settings.id.title'),
			description: t('organization.settings.id.desc'),
			component: <CopyInput readOnly value={organization?.iid} />,
		},
		{
			title: t('organization.settings.name.title'),
			description: t('organization.settings.name.desc'),
			component: <ChangeOrganizationName />,
		},
		{
			title: t('organization.settings.avatar.title'),
			description: t('organization.settings.avatar.desc'),
			component: <ChangeOrganizationAvatar />,
		},
		{
			title: t('organization.settings.transfer.title'),
			description: t('organization.settings.transfer.desc'),
			component: <TransferOrganization />,
		},
		{
			title: t('organization.settings.delete.title'),
			description: t('organization.settings.delete.desc'),
			component: <DeleteOrganization />,
		},
	];

	return (
		<SettingsContainer pageTitle={t('organization.settings.general')}>
			<div className='divide-y'>
				{ORGANIZATION_GENERAL_SETTINGS.map((item, index) => (
					<SettingsFormItem
						key={index}
						title={item.title}
						description={item.description}
						className='space-y-4 py-6'
						twoColumns={index === 2}
					>
						{item.component}
					</SettingsFormItem>
				))}
			</div>
		</SettingsContainer>
	);
}
