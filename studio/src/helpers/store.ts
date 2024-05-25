import { STATE_LIST } from '@/constants/stateList';
import useApplicationStore from '@/store/app/applicationStore';
import { StateCreator, create as _create } from 'zustand';
const storeResetFns = new Set<() => void>();

export const resetAllStores = () => {
	Object.entries(STATE_LIST).forEach(([, store]) => {
		store?.getState()?.reset?.();
	});
	useApplicationStore.getState().reset();
};

export const create = (<T>() => {
	return (stateCreator: StateCreator<T>) => {
		const store = _create(stateCreator);
		const initialState = store.getState();
		storeResetFns.add(() => {
			store.setState(initialState, true);
		});
		return store;
	};
}) as typeof _create;
