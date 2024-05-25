import _ from 'lodash';
import { useCallback } from 'react';
export default function useDebounceFn(callback: (val: any) => void, delay: number) {
	const debouncedCallback = useCallback(_.debounce(callback, delay), [callback, delay]);

	return debouncedCallback;
}
