import { Sortable, SortableContainer, SortableItem } from '@/components/Sortable';
import useVersionStore from '@/store/version/versionStore.ts';
import { RateLimit } from '@/types';
import { Draggable, DropResult } from 'react-beautiful-dnd';
import { useTranslation } from 'react-i18next';
import AddRateLimiterDropdown from './AddRateLimiterDropdown';
import { useAuthorizeVersion } from '@/hooks';
interface SortableRateLimitsProps {
	onDragEnd: (result: DropResult) => void;
	onSelect: (limiter: RateLimit) => void;
	onDeleteItem: (id: string) => void;
	options: RateLimit[] | undefined;
	selectedLimits: string[];
	loading?: boolean;
	hasToAddAsDefault?: 'endpoint' | 'realtime';
}

export default function SortableRateLimits({
	onDragEnd,
	onSelect,
	onDeleteItem,
	loading,
	options,
	selectedLimits,
	hasToAddAsDefault,
}: SortableRateLimitsProps) {
	const { t } = useTranslation();
	const rateLimits = useVersionStore((state) => state.version?.limits);
	const canEdit = useAuthorizeVersion('version.update');
	return (
		<SortableContainer
			title={t('version.rate_limiters')}
			actions={
				<AddRateLimiterDropdown
					options={options}
					onSelect={onSelect}
					hasToAddAsDefault={hasToAddAsDefault}
					disabled={!canEdit}
				/>
			}
		>
			<Sortable onDragEnd={onDragEnd}>
				{selectedLimits?.length > 0 ? (
					selectedLimits?.map((iid, index) => (
						<Draggable
							key={index}
							draggableId={index.toString()}
							index={index}
							isDragDisabled={!canEdit}
						>
							{(provided) => (
								<SortableItem<RateLimit>
									item={rateLimits?.find((item) => item.iid === iid) as RateLimit}
									provided={provided}
									onDelete={onDeleteItem}
									loading={loading}
									disabled={!canEdit}
								/>
							)}
						</Draggable>
					))
				) : (
					<p className='text-default font-sfCompact text-xs text-center'>
						{t('version.rate_limiters_empty')}
					</p>
				)}
			</Sortable>
		</SortableContainer>
	);
}
