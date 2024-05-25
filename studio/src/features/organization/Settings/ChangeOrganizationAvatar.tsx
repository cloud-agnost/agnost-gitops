import { ChangeAvatar } from '@/components/ChangeAvatar';
import useAuthorizeOrg from '@/hooks/useAuthorizeOrg';
import useOrganizationStore from '@/store/organization/organizationStore';
import { APIError } from '@/types';
import { useState } from 'react';

export default function ChangeOrganizationAvatar() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<APIError | null>(null);
	const canUpdate = useAuthorizeOrg('update');
	const { organization, changeOrganizationAvatar, removeOrganizationAvatar } =
		useOrganizationStore();
	async function onChangeHandler(file: File) {
		setLoading(true);
		changeOrganizationAvatar({
			picture: file,
			organizationId: organization?._id as string,
			onSuccess: () => {
				setLoading(false);
			},
			onError: (error: APIError) => {
				setError(error);
				setLoading(false);
			},
		});
	}

	async function onClickHandler() {
		setError(null);
		setLoading(true);
		removeOrganizationAvatar({
			onSuccess: () => {
				setLoading(false);
			},
			onError: (error: APIError) => {
				setError(error);
				setLoading(false);
			},
		});
	}
	return (
		<ChangeAvatar
			item={{
				name: organization?.name as string,
				color: organization?.color as string,
				pictureUrl: organization?.pictureUrl as string,
				_id: organization?._id as string,
			}}
			onChange={onChangeHandler}
			removeAvatar={onClickHandler}
			error={error}
			loading={loading}
			disabled={!canUpdate}
		/>
	);
}
