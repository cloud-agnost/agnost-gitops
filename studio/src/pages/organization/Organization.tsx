import { OrganizationCreateModal } from '@/features/organization';
import { RequireAuth } from '@/router';
import useApplicationStore from '@/store/app/applicationStore.ts';
import useOrganizationStore from '@/store/organization/organizationStore.ts';
import useProjectStore from '@/store/project/projectStore';
import { useEffect, useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';

export default function Organization() {
	const [openOrgCreateModal, setOpenOrgCreateModal] = useState(false);
	const { orgId } = useParams();
	const { getOrgPermissions } = useOrganizationStore();
	const { getAppPermissions } = useApplicationStore();
	const { getProjectPermissions } = useProjectStore();
	useEffect(() => {
		getAppPermissions(orgId as string);
		getProjectPermissions(orgId as string);
		getOrgPermissions();
	}, [orgId]);

	return (
		<RequireAuth>
			<>
				<OrganizationCreateModal
					key={openOrgCreateModal.toString()}
					isOpen={openOrgCreateModal}
					closeModal={() => setOpenOrgCreateModal(false)}
				/>

				<Outlet
					context={{
						openOrgCreateModal: () => setOpenOrgCreateModal(true),
						closeOrgCreateModal: () => setOpenOrgCreateModal(false),
					}}
				/>
			</>
		</RequireAuth>
	);
}
