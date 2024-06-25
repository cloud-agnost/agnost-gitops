import { Loading } from '@/components/Loading';
import { componentLoader } from '@/helpers';
import ErrorBoundary from '@/pages/errors/ErrorBoundary';
import { Root } from '@/pages/root';
import useAuthStore from '@/store/auth/authStore.ts';
import useClusterStore from '@/store/cluster/clusterStore.ts';
import loadable from '@loadable/component';
import type { ReactNode } from 'react';
import { Navigate, createBrowserRouter, useLocation } from 'react-router-dom';
import authLoaders from './loader/AuthLoader';
import homeLoaders from './loader/HomeLoader';
import onboardingLoaders from './loader/OnboardingLoader';
export function Fallback(): JSX.Element {
	return (
		<div className='relative h-screen'>
			<Loading />
		</div>
	);
}

const HomeLoadable = loadable(() => componentLoader(() => import('../pages/home/Home')), {
	fallback: <Fallback />,
	resolveComponent: (mod: any) => mod.default,
});

const Login = loadable(() => componentLoader(() => import('../pages/auth/Login')), {
	fallback: <Fallback />,
	resolveComponent: (mod: any) => mod.default,
});

const ForgotPassword = loadable(
	() => componentLoader(() => import('../pages/auth/ForgotPassword')),
	{
		fallback: <Fallback />,
		resolveComponent: (mod: any) => mod.default,
	},
);
const ChangePasswordWithTokenLoadable = loadable(
	() => componentLoader(() => import('../pages/auth/ChangePasswordWithToken')),
	{
		fallback: <Fallback />,
		resolveComponent: (mod: any) => mod.default,
	},
);

const ConfirmChangeEmailLoadable = loadable(
	() => componentLoader(() => import('../pages/auth/ConfirmChangeEmail')),
	{
		fallback: <Fallback />,
		resolveComponent: (mod: any) => mod.default,
	},
);

const VerifyEmail = loadable(() => componentLoader(() => import('../pages/auth/VerifyEmail')), {
	fallback: <Fallback />,
	resolveComponent: (mod: any) => mod.default,
});

const CompleteAccountSetup = loadable(
	() => componentLoader(() => import('../pages/auth/CompleteAccountSetup')),
	{
		fallback: <Fallback />,
		resolveComponent: (mod: any) => mod.default,
	},
);

const CompleteAccountSetupVerifyEmailLoadable = loadable(
	() => componentLoader(() => import('../pages/auth/CompleteAccountSetupVerifyEmail')),
	{
		fallback: <Fallback />,
		resolveComponent: (mod: any) => mod.default,
	},
);

const Organization = loadable(
	() => componentLoader(() => import('../pages/organization/Organization')),
	{
		fallback: <Fallback />,
		resolveComponent: (mod: any) => mod.default,
	},
);

const OrganizationSelect = loadable(
	() => componentLoader(() => import('../pages/organization/OrganizationSelect')),
	{
		fallback: <Fallback />,
		resolveComponent: (mod: any) => mod.default,
	},
);

const OrganizationDetailsLoadable = loadable(
	() => componentLoader(() => import('../pages/organization/OrganizationDetails')),
	{
		fallback: <Fallback />,
		resolveComponent: (mod: any) => mod.default,
	},
);

const OrganizationProjects = loadable(
	() => componentLoader(() => import('../pages/organization/OrganizationProjects')),
	{
		fallback: <Fallback />,
		resolveComponent: (mod: any) => mod.default,
	},
);

const OrganizationResources = loadable(
	() => componentLoader(() => import('../pages/organization/OrganizationResources')),
	{
		fallback: <Fallback />,
		resolveComponent: (mod: any) => mod.default,
	},
);

const OrganizationSettings = loadable(
	() => componentLoader(() => import('../pages/organization/OrganizationSettings')),
	{
		fallback: <Fallback />,
		resolveComponent: (mod: any) => mod.default,
	},
);
const OrganizationSettingsGeneral = loadable(
	() =>
		componentLoader(
			() => import('../pages/organization/OrganizationSettings/OrganizationSettingsGeneral'),
		),
	{
		fallback: <Fallback />,
		resolveComponent: (mod: any) => mod.default,
	},
);

const OrganizationSettingsMembers = loadable(
	() =>
		componentLoader(
			() => import('../pages/organization/OrganizationSettings/OrganizationSettingsMembers'),
		),
	{
		fallback: <Fallback />,
		resolveComponent: (mod: any) => mod.default,
	},
);

const ProjectEnvironment = loadable(
	() => componentLoader(() => import('../pages/project-environment/ProjectEnvironment')),
	{
		fallback: <Fallback />,
		resolveComponent: (mod: any) => mod.default,
	},
);
const ProjectEnvironmentDetail = loadable(
	() => componentLoader(() => import('../pages/project-environment/ProjectEnvironmentContainers')),
	{
		fallback: <Fallback />,
		resolveComponent: (mod: any) => mod.default,
	},
);

// profileSettings
const ProfileSettings = loadable(
	() => componentLoader(() => import('../pages/profile/ProfileSettings')),
	{
		fallback: <Fallback />,
		resolveComponent: (mod: any) => mod.default,
	},
);

const ProfileSettingsGeneral = loadable(
	() => componentLoader(() => import('../pages/profile/ProfileSettingsGeneral')),
	{
		fallback: <Fallback />,
		resolveComponent: (mod: any) => mod.default,
	},
);

const ProfileSettingsNotifications = loadable(
	() => componentLoader(() => import('../pages/profile/ProfileSettingsNotifications')),
	{
		fallback: <Fallback />,
		resolveComponent: (mod: any) => mod.default,
	},
);

const ClusterManagement = loadable(
	() => componentLoader(() => import('../pages/profile/ClusterManagement')),
	{
		fallback: <Fallback />,
		resolveComponent: (mod: any) => mod.default,
	},
);

// onboarding
const OnboardingLoadable = loadable(
	() => componentLoader(() => import('../pages/onboarding/Onboarding')),
	{
		fallback: <Fallback />,
		resolveComponent: (mod: any) => mod.default,
	},
);

const AccountInformationLoadable = loadable(
	() => componentLoader(() => import('../pages/onboarding/AccountInformation')),
	{
		fallback: <Fallback />,
		resolveComponent: (mod: any) => mod.default,
	},
);

const CreateProject = loadable(
	() => componentLoader(() => import('../pages/onboarding/CreateProject')),
	{
		fallback: <Fallback />,
		resolveComponent: (mod: any) => mod.default,
	},
);

// others
const RedirectHandleLoadable = loadable(
	() => componentLoader(() => import('../pages/redirect-handle/RedirectHandle')),
	{
		fallback: <Fallback />,
		resolveComponent: (mod: any) => mod.default,
	},
);

const NotFound = loadable(() => componentLoader(() => import('../pages/errors/404')), {
	fallback: <Fallback />,
	resolveComponent: (mod: any) => mod.default,
});

const Unauthorized = loadable(() => componentLoader(() => import('../pages/errors/401')), {
	fallback: <Fallback />,
	resolveComponent: (mod: any) => mod.default,
});

const router = createBrowserRouter(
	[
		{
			path: '/',
			element: <Root />,
			children: [
				{
					index: true,
					element: <HomeLoadable />,
					loader: homeLoaders.homeLoader,
				},
				{
					path: '/login',
					element: <Login />,
				},
				{
					path: '/forgot-password',
					element: <ForgotPassword />,
				},
				{
					path: '/confirm-change-email',
					element: <ConfirmChangeEmailLoadable />,
					loader: authLoaders.confirmChangeEmailLoader,
				},
				{
					path: '/change-password',
					element: <ChangePasswordWithTokenLoadable />,
					loader: authLoaders.changePasswordWithTokenLoader,
				},
				{
					path: '/verify-email',
					element: <VerifyEmail />,
				},
				{
					path: '/complete-account-setup',
					element: <CompleteAccountSetup />,
				},
				{
					path: '/complete-account-setup/verify-email',
					element: <CompleteAccountSetupVerifyEmailLoadable />,
				},
				{
					path: 'profile',
					element: <ProfileSettings />,
					children: [
						{
							index: true,
							path: '',
							element: <ProfileSettingsGeneral />,
						},
						{
							path: 'cluster-management',
							element: <ClusterManagement />,
							loader: homeLoaders.clusterManagementLoader,
						},
						{
							path: 'notifications',
							element: <ProfileSettingsNotifications />,
						},
						{
							path: 'cluster-management',
							element: <ClusterManagement />,
						},
					],
				},
				{
					path: '/organization',
					element: <Organization />,
					children: [
						{
							path: '',
							element: <OrganizationSelect />,
							loader: homeLoaders.organizationSelectLoader,
						},
						{
							path: ':orgId',
							element: <OrganizationDetailsLoadable />,
							children: [
								{
									path: 'projects',
									children: [
										{
											index: true,
											element: <OrganizationProjects />,
										},
										{
											path: ':projectId/env/:envId',
											element: <ProjectEnvironment />,
											children: [
												{
													path: '',
													element: <ProjectEnvironmentDetail />,
												},
											],
										},
									],
								},
								{
									path: 'resources',
									element: <OrganizationResources />,
								},
								{
									path: 'settings',
									element: <OrganizationSettings />,
									children: [
										{
											index: true,
											path: '',
											element: <OrganizationSettingsGeneral />,
										},
										{
											path: 'members',
											element: <OrganizationSettingsMembers />,
										},
									],
								},
							],
						},
					],
				},
			],
			errorElement: <ErrorBoundary />,
		},
		{
			path: '/register',
			element: <OnboardingLoadable />,
			loader: onboardingLoaders.onboardingLoader,
			errorElement: <ErrorBoundary />,
			children: [
				{
					path: '',
					element: <AccountInformationLoadable />,
					loader: onboardingLoaders.accountInformationLoader,
				},
				{
					path: 'project',
					element: <CreateProject />,
				},
			],
		},
		{
			path: '/redirect-handle',
			element: <RedirectHandleLoadable />,
			loader: homeLoaders.redirectHandleLoader,
			errorElement: <ErrorBoundary />,
		},
		{
			path: '/*',
			element: <NotFound />,
			errorElement: <ErrorBoundary />,
		},
		{
			path: '/401',
			element: <Unauthorized />,
			errorElement: <ErrorBoundary />,
		},
	],
	{
		basename: '/studio',
	},
);

export function RequireAuth({ children }: { children: JSX.Element }): JSX.Element {
	const { isAuthenticated } = useAuthStore();
	const location = useLocation();

	if (!isAuthenticated()) {
		return <Navigate to='/login' state={{ from: location }} replace />;
	}

	return children;
}

export function GuestOnly({ children }: { children: ReactNode }): JSX.Element {
	const { isAuthenticated } = useAuthStore();
	const { isCompleted } = useClusterStore();
	const { pathname } = useLocation();

	if (isAuthenticated() && isCompleted) {
		return <Navigate to='/organization' />;
	} else if (!isCompleted && pathname !== '/register') {
		return <Navigate to='/register' />;
	}

	return children as JSX.Element;
}

export default router;
