import { ApplicationVersions } from '@/features/application';
import AppInviteMember from '@/features/application/AppInviteMember';
import EditApplication from '@/features/application/EditApplication.tsx';
import { EditorSettings } from '@/features/auth/EditorSettings';
import ReleaseHistory from '@/features/cluster/ReleaseHistory';
import CreateEnvironment from '@/features/projects/CreateEnvironment';
import EditProject from '@/features/projects/EditProject';
import ProjectEnvironments from '@/features/projects/ProjectEnvironments';
import ProjectInviteMember from '@/features/projects/ProjectInviteMember';
import { AddResourceDrawer } from '@/features/resources';
import { CreateCopyVersionDrawer } from '@/features/version/CreateCopyVersionDrawer';
import PushVersion from '@/features/version/PushVersion/PushVersion';
import useAuthStore from '@/store/auth/authStore.ts';
import useClusterStore from '@/store/cluster/clusterStore.ts';
import useEnvironmentStore from '@/store/environment/environmentStore';
import useOrganizationStore from '@/store/organization/organizationStore.ts';
import { history, joinChannel } from '@/utils';
import _ from 'lodash';
import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';

const authPaths = [
	'/login',
	'/forgot-password',
	'/confirm-change-email',
	'/forgot-password',
	'/verify-email',
	'/complete-account-setup',
	'/complete-account-setup/verify-email',
];

export default function Root() {
	history.navigate = useNavigate();
	history.location = useLocation();
	const { pathname } = useLocation();
	const navigate = useNavigate();
	const { orgId, versionId, appId } = useParams();
	const { checkClusterSmtpStatus, checkClusterSetup, checkCICDStatus } = useClusterStore();
	const { getOrganizationMembers, getOrganizationById, members, organization } =
		useOrganizationStore();
	const { getUser, isAuthenticated } = useAuthStore();
	const { getAppVersionEnvironment, getEnvironmentResources } = useEnvironmentStore();

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
		const getEnv = async () => {
			return await getAppVersionEnvironment({
				appId: appId as string,
				orgId: orgId as string,
				versionId: versionId as string,
			});
		};

		const getResources = async () => {
			const env = await getEnv();
			return await getEnvironmentResources({
				appId: appId as string,
				orgId: orgId as string,
				versionId: versionId as string,
				envId: env._id,
			});
		};

		if (orgId && versionId && appId) {
			getResources();
		}
	}, [versionId]);

	useEffect(() => {
		checkClusterSmtpStatus();
		checkCICDStatus();
		checkClusterSetup({
			onSuccess: (isCompleted) => {
				if (!isCompleted) {
					navigate('/onboarding');
				}
			},
		});
	}, []);

	useEffect(() => {
		const isAuthPath = authPaths.includes(pathname);
		if (!isAuthPath && isAuthenticated()) {
			getUser();
			joinChannel('cluster');
		}
	}, []);

	return (
		<>
			<Outlet />
			<ApplicationVersions />
			<ProjectEnvironments />
			<EditApplication />
			<EditProject />
			<CreateCopyVersionDrawer />
			<CreateEnvironment />
			<PushVersion />
			<AddResourceDrawer />
			<AppInviteMember />
			<ProjectInviteMember />
			<ReleaseHistory />
			<EditorSettings />
		</>
	);
}
