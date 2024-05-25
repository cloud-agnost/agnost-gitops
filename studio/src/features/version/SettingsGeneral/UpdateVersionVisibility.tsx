import { SettingsFormItem } from '@/components/SettingsFormItem';
import { useAuthorizeVersion, useUpdateVersion } from '@/hooks';
import useVersionStore from '@/store/version/versionStore';
import { Switch } from '@/components/Switch';
import { useTranslation } from 'react-i18next';

export default function UpdateVersionVisibility() {
	const { version } = useVersionStore();
	const { t } = useTranslation();
	const canEdit = useAuthorizeVersion('version.update');
	const { updateVersion } = useUpdateVersion();

	return (
		<>
			<SettingsFormItem
				twoColumns
				className='space-y-0 py-6'
				contentClassName='flex items-center justify-end'
				title={t('version.read_only')}
				description={t('version.settings.read_only_desc')}
			>
				<Switch
					disabled={!canEdit}
					checked={version?.readOnly}
					onCheckedChange={(checked) => updateVersion({ readOnly: checked })}
				/>
			</SettingsFormItem>
			{!version?.master && (
				<SettingsFormItem
					twoColumns
					className='space-y-0 py-6'
					contentClassName='pt-6'
					title={t('version.private')}
					description={t('version.settings.private_desc')}
				>
					<Switch
						disabled={version?.master || !canEdit}
						checked={version?.private}
						onCheckedChange={(checked) => updateVersion({ private: checked })}
					/>
				</SettingsFormItem>
			)}
		</>
	);
}
