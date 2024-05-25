import { SettingsFormItem } from '@/components/SettingsFormItem';
import { SortableRateLimits } from '@/features/version/SettingsGeneral';
import { useUpdateVersion } from '@/hooks';
import useSettingsStore from '@/store/version/settingsStore';
import useVersionStore from '@/store/version/versionStore.ts';
import { RateLimit } from '@/types';
import { reorder } from '@/utils';
import { DropResult } from 'react-beautiful-dnd';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
export default function EndpointRateLimiters() {
	const { t } = useTranslation();

	const { updateVersion, isPending } = useUpdateVersion();
	const defaultEndpointLimits = useVersionStore((state) => state.version?.defaultEndpointLimits);
	const defaultRateLimiters = useVersionStore(
		(state) => state.version?.defaultEndpointLimits ?? [],
	);
	const rateLimits = useVersionStore((state) => state.version?.limits);

	const rateLimitsNotInDefault = rateLimits?.filter(
		(item) => !defaultRateLimiters?.includes(item.iid),
	);
	const orderLimits = useSettingsStore((state) => state.orderEndpointRateLimits);
	const { orgId, versionId, appId } = useParams<{
		versionId: string;
		appId: string;
		orgId: string;
	}>();

	async function onDragEnd(result: DropResult) {
		if (!result.destination || !defaultRateLimiters || !versionId || !appId || !orgId) return;
		const ordered = reorder(defaultRateLimiters, result.source.index, result.destination.index);
		orderLimits(ordered);
		updateVersion({
			defaultEndpointLimits: ordered,
		});
	}

	async function addToDefault(limiter: RateLimit) {
		if (!defaultRateLimiters || !versionId || !appId || !orgId) return;
		updateVersion({ defaultEndpointLimits: [...(defaultRateLimiters ?? []), limiter.iid] });
	}

	async function deleteHandler(limitId?: string) {
		if (!versionId || !appId || !orgId || !limitId) return;
		updateVersion({
			defaultEndpointLimits: defaultEndpointLimits?.filter((item) => item !== limitId),
		});
	}

	return (
		<SettingsFormItem
			className='space-y-0 py-0 pt-6'
			contentClassName='pt-6'
			title={t('version.settings.endpoint_rate_limit')}
			description={t('version.settings.endpoint_rate_limit_desc')}
		>
			<SortableRateLimits
				onDragEnd={onDragEnd}
				options={rateLimitsNotInDefault}
				onSelect={addToDefault}
				selectedLimits={defaultRateLimiters}
				onDeleteItem={(limitId: string) => deleteHandler(limitId)}
				loading={isPending}
				hasToAddAsDefault='endpoint'
			/>
		</SettingsFormItem>
	);
}
