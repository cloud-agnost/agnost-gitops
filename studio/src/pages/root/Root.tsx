import ReleaseHistory from '@/features/cluster/ReleaseHistory';
import CreateEnvironment from '@/features/projects/CreateEnvironment';
import EditProject from '@/features/projects/EditProject';
import Environments from '@/features/projects/Environments';
import ProjectInviteMember from '@/features/projects/ProjectInviteMember';
import useAuthStore from '@/store/auth/authStore.ts';
import useClusterStore from '@/store/cluster/clusterStore.ts';
import useOrganizationStore from '@/store/organization/organizationStore.ts';
import { history, joinChannel } from '@/utils';
import _ from 'lodash';
import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';

export default function Root() {
	history.navigate = useNavigate();
	history.location = useLocation();
	const { pathname } = useLocation();
	const navigate = useNavigate();
	const { orgId } = useParams();
	const { checkClusterSetup } = useClusterStore();
	const { getOrganizationMembers, getOrganizationById, members, organization } =
		useOrganizationStore();
	const { getUser, isAuthenticated } = useAuthStore();

	useEffect(() => {
		if (orgId) {
			if (_.isEmpty(organization)) {
				getOrganizationById(orgId);
			}
			if (_.isEmpty(members)) {
				getOrganizationMembers({
					organizationId: orgId,
				});
			}
		}
	}, [orgId]);

	useEffect(() => {
		checkClusterSetup().then((isCompleted) => {
			if (!isCompleted) {
				navigate('/register');
			}
		});
	}, []);

	useEffect(() => {
		const isAuthPath = pathname === '/login';
		if (!isAuthPath && isAuthenticated()) {
			getUser();
			joinChannel('cluster');
		}
	}, []);

	return (
		<>
			<Outlet />
			<Environments />
			<EditProject />
			<CreateEnvironment />
			<ProjectInviteMember />
			<ReleaseHistory />
		</>
	);
}
