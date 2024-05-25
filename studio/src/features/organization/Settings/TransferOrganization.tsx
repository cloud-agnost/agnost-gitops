import { TransferOwnership } from '@/components/TransferOwnership';
import useAuthStore from '@/store/auth/authStore';
import useOrganizationStore from '@/store/organization/organizationStore';

export default function TransferOrganization() {
	const { transferOrganization, organization } = useOrganizationStore();
	const user = useAuthStore((state) => state.user);
	return (
		<TransferOwnership
			transferFn={transferOrganization}
			type='org'
			disabled={organization.ownerUserId !== user._id}
		/>
	);
}
