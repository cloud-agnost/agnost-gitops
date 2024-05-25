import useUtilsStore from '@/store/version/utilsStore';
import { ColumnResizedEvent, ColumnState, FirstDataRenderedEvent } from 'ag-grid-community';
import _ from 'lodash';
import { useCallback } from 'react';
export default function useSaveColumnState(id: string) {
	const { saveColumnState, getColumnState } = useUtilsStore();

	const saveColumnStateDebounced = useCallback(
		_.debounce((columnState: ColumnState[]) => {
			saveColumnState(id, columnState);
		}, 1000),
		[id, saveColumnState],
	);

	const handleColumnStateChange = useCallback(
		(params: ColumnResizedEvent) => {
			const columnState = params.api.getColumnState();
			saveColumnStateDebounced(columnState);
		},
		[saveColumnStateDebounced],
	);

	function onFirstDataRendered(event: FirstDataRenderedEvent) {
		const columnState = getColumnState(id);
		if (columnState) {
			event.api.applyColumnState({
				state: columnState,
				applyOrder: true,
			});
		}
		event.api.hideOverlay();
	}

	return { handleColumnStateChange, onFirstDataRendered };
}
