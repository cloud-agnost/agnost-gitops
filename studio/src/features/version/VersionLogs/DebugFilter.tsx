import { BooleanFilter } from '@/features/database/models/Navigator';
import { FieldTypes } from '@/types';
import FilterLayout from './FilterLayout';

export default function DebugFilter() {
	return (
		<FilterLayout columnName='debug'>
			<BooleanFilter
				type={FieldTypes.BOOLEAN}
				columnName='debug'
				entityId={window.location.pathname.split('/')[8]}
			/>
		</FilterLayout>
	);
}
