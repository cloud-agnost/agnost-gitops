import useOrganizationStore from '@/store/organization/organizationStore';
import { getOrgPermission } from '@/utils';
import React from 'react';

export default function useAuthorizeOrg(key: string) {
	const org = useOrganizationStore((state) => state.organization);
	const hasPermission = React.useMemo(() => getOrgPermission(key), [key, org]);

	return hasPermission;
}
