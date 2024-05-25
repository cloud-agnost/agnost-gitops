import { CopyInput } from '@/components/CopyInput';
import { SettingsContainer } from '@/features/version/SettingsContainer';
import { RealtimeRateLimits } from '@/features/version/SettingsRealtime';
import { useToast } from '@/hooks';
import useAuthorizeVersion from '@/hooks/useAuthorizeVersion';
import useEnvironmentStore from '@/store/environment/environmentStore';
import useSettingsStore from '@/store/version/settingsStore';
import useVersionStore from '@/store/version/versionStore.ts';
import { APIError, VersionRealtimeProperties } from '@/types';
import { useMutation } from '@tanstack/react-query';
import { SettingsFormItem } from 'components/SettingsFormItem';
import { Switch } from 'components/Switch';
import { useTranslation } from 'react-i18next';

export default function VersionSettingsRealTime() {
	const realtime = useVersionStore((state) => state.version?.realtime);
	const { version } = useVersionStore();
	const { environment } = useEnvironmentStore();
	const { updateVersionRealtimeProperties } = useSettingsStore();
	const canEdit = useAuthorizeVersion('version.update');
	const { toast } = useToast();
	const { t } = useTranslation();

	const { mutateAsync } = useMutation({
		mutationFn: updateVersionRealtimeProperties,
		onError: (error: APIError) => {
			toast({
				action: 'error',
				title: error.details,
			});
		},
		onSuccess: () => {
			toast({
				title: t('version.realtime.update_success') as string,
				action: 'success',
			});
		},
	});
	async function update(data: Partial<VersionRealtimeProperties>) {
		mutateAsync({
			versionId: version._id,
			orgId: version.orgId,
			appId: version.appId,
			enabled: data.enabled ?? realtime?.enabled,
			apiKeyRequired: data.apiKeyRequired ?? realtime?.apiKeyRequired,
			sessionRequired: data.sessionRequired ?? realtime?.sessionRequired,
			rateLimits: data.rateLimits ?? realtime?.rateLimits,
		});
	}

	return (
		<SettingsContainer pageTitle='Real Time'>
			<div className='divide-y'>
				<SettingsFormItem
					className='space-y-0 py-0 pb-6'
					contentClassName='pt-6'
					title={t('version.settings.realtime_url')}
					description={t('version.settings.realtime_url_desc')}
				>
					<CopyInput readOnly value={`${window.location.origin}/${environment?.iid}`} />
				</SettingsFormItem>
				<SettingsFormItem
					twoColumns
					className='space-y-0 py-6 pt-0'
					contentClassName='flex items-center justify-end'
					title={t('version.realtime.activate_realtime')}
					description={t('version.realtime.activate_realtime_desc')}
				>
					<Switch
						onCheckedChange={(enabled) => update({ enabled })}
						checked={realtime?.enabled}
						disabled={!canEdit}
					/>
				</SettingsFormItem>
				<SettingsFormItem
					twoColumns
					className='space-y-0 py-6'
					contentClassName='flex items-center justify-end'
					title={t('version.realtime.api_key_required')}
					description={t('version.realtime.api_key_required_desc')}
				>
					<Switch
						disabled={!canEdit}
						onCheckedChange={(apiKeyRequired) => update({ apiKeyRequired })}
						checked={realtime?.apiKeyRequired}
					/>
				</SettingsFormItem>
				<SettingsFormItem
					twoColumns
					className='space-y-0 py-6'
					contentClassName='flex items-center justify-end'
					title={t('version.realtime.session_required')}
					description={t('version.realtime.session_required_desc')}
				>
					<Switch
						disabled={!canEdit}
						onCheckedChange={(sessionRequired) => update({ sessionRequired })}
						checked={realtime?.sessionRequired}
					/>
				</SettingsFormItem>
				<SettingsFormItem
					className='space-y-0 py-0 pt-6'
					contentClassName='pt-6'
					title={t('version.realtime.rate_limiter')}
					description={t('version.realtime.rate_limiter_desc')}
				>
					<RealtimeRateLimits />
				</SettingsFormItem>
			</div>
		</SettingsContainer>
	);
}
