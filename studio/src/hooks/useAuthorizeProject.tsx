import useProjectStore from '@/store/project/projectStore';
import { getProjectPermission } from '@/utils';
import React from 'react';

export default function useAuthorizeProject(key: string) {
	const project = useProjectStore((state) => state.project);
	return React.useMemo(() => getProjectPermission(key), [project]);
}
