import { ChangeAvatar } from '@/components/ChangeAvatar';
import useAuthorizeOrg from '@/hooks/useAuthorizeOrg';
import useOrganizationStore from '@/store/organization/organizationStore';
import { useMutation } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

export default function ChangeOrganizationAvatar() {
	const canUpdate = useAuthorizeOrg('update');
	const { organization, changeOrganizationAvatar, removeOrganizationAvatar } =
		useOrganizationStore();
	const { orgId } = useParams() as Record<string, string>;

	const {
		mutate: changeAvatar,
		isPending: changeLoading,
		error: changeError,
	} = useMutation({
		mutationFn: (file: File) =>
			changeOrganizationAvatar({
				organizationId: orgId,
				picture: file,
			}),
	});
	const {
		mutate: remove,
		isPending: removeLoading,
		error: removeError,
	} = useMutation({
		mutationFn: removeOrganizationAvatar,
	});

	return (
		<ChangeAvatar
			item={{
				name: organization?.name,
				color: organization?.color,
				pictureUrl: organization?.pictureUrl,
				_id: organization?._id,
			}}
			onChange={changeAvatar}
			removeAvatar={remove}
			error={changeError ?? removeError}
			loading={changeLoading || removeLoading}
			disabled={!canUpdate}
		/>
	);
}
