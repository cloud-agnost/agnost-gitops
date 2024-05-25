import { DefaultFilter } from '@/features/database/models/Navigator';
import { FieldTypes } from '@/types';
import FilterLayout from './FilterLayout';

export default function DurationFilter() {
	return (
		<FilterLayout columnName='duration'>
			<DefaultFilter
				type={FieldTypes.INTEGER}
				columnName='duration'
				entityId={window.location.pathname.split('/')[8]}
			/>
		</FilterLayout>
	);
}
