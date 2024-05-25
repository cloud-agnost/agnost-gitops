import useApplicationStore from '@/store/app/applicationStore';
import { getAppPermission } from '@/utils';
import React from 'react';

export default function useAuthorizeApp(key: string) {
	const app = useApplicationStore((state) => state.application);
	return React.useMemo(() => getAppPermission(key), [app]);
}
