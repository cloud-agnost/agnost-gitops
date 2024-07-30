import { Loading } from '@/components/Loading';
import { componentLoader } from '@/helpers';
import ErrorBoundary from '@/pages/errors/ErrorBoundary';
import Health from '@/pages/home/Health';
import { Root } from '@/pages/root';
import useAuthStore from '@/store/auth/authStore.ts';
import useClusterStore from '@/store/cluster/clusterStore.ts';
import loadable from '@loadable/component';
import type { ReactNode } from 'react';
import { Navigate, createBrowserRouter, useLocation } from 'react-router-dom';
import AuthLoader from './loader/AuthLoader';
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

const Environment = loadable(
	() => componentLoader(() => import('../pages/environment/Environment')),
	{
		fallback: <Fallback />,
		resolveComponent: (mod: any) => mod.default,
	},
);
const EnvironmentDetail = loadable(
	() => componentLoader(() => import('../pages/environment/EnvironmentContainers')),
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

const Register = loadable(() => componentLoader(() => import('../pages/onboarding/Register')), {
	fallback: <Fallback />,
	resolveComponent: (mod: any) => mod.default,
});

const CreateProject = loadable(
	() => componentLoader(() => import('../pages/onboarding/AccountSetup')),
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
const OrgAcceptInvitation = loadable(
	() => componentLoader(() => import('../pages/auth/OrgAcceptInvitation')),
	{
		fallback: <Fallback />,
		resolveComponent: (mod: any) => mod.default,
	},
);
const ProjectAcceptInvitation = loadable(
	() => componentLoader(() => import('../pages/auth/ProjectAcceptInvitation')),
	{
		fallback: <Fallback />,
		resolveComponent: (mod: any) => mod.default,
	},
);

const Notifications = loadable(
	() => componentLoader(() => import('../pages/notifications/Notifications')),
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
					path: '/health',
					element: <Health />,
				},
				{
					path: '/login',
					loader: AuthLoader.loginLoader,
					element: <Login />,
				},
				{
					path: 'notifications',
					element: <Notifications />,
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
											element: <Environment />,
											children: [
												{
													path: '',
													element: <EnvironmentDetail />,
												},
											],
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
					element: <Register />,
					loader: AuthLoader.registerLoader,
				},
				{
					path: 'setup',
					element: <CreateProject />,
				},
			],
		},
		{
			path: '/org-accept',
			element: <OrgAcceptInvitation />,
			loader: AuthLoader.orgAcceptInvitation,
			errorElement: <ErrorBoundary />,
		},
		{
			path: '/project-accept',
			element: <ProjectAcceptInvitation />,
			loader: AuthLoader.projectAcceptInvite,
			errorElement: <ErrorBoundary />,
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
