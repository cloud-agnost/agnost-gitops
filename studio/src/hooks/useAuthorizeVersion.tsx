import useApplicationStore from '@/store/app/applicationStore';
import useAuthStore from '@/store/auth/authStore';
import useVersionStore from '@/store/version/versionStore';
import { getAppPermission } from '@/utils';
import { useMemo } from 'react';

export default function useAuthorizeVersion(type: string) {
	const version = useVersionStore((state) => state.version);
	const role = useApplicationStore((state) => state.application?.role);
	const user = useAuthStore((state) => state.user);
	const isPrivateForUser = version?.private ? user?._id === version.createdBy : true;
	const canEdit = useMemo(
		() =>
			(version?.readOnly
				? user?._id === version.createdBy || role === 'Admin'
				: isPrivateForUser && getAppPermission(type)) as boolean,
		[version, role],
	);
	return canEdit;
}
