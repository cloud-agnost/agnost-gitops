import useAuthStore from '@/store/auth/authStore';
import useOrganizationStore from '@/store/organization/organizationStore';
import { resetAfterOrgChange } from '@/utils';
import { LoaderFunctionArgs, redirect } from 'react-router-dom';

const REDIRECT_URLS = {
	'project-invite':
		'/complete-account-setup/verify-email?token=:token&isVerified=true&type=project',
	'app-invite': '/complete-account-setup/verify-email?token=:token&isVerified=true&type=app',
	'org-invite': '/complete-account-setup/verify-email?token=:token&isVerified=true&type=org',
	'change-email': '/confirm-change-email?token=:token',
	'reset-pwd': '/change-password?token=:token',
};

function homeLoader() {
	if (useAuthStore.getState().isAuthenticated()) {
		return redirect('/organization');
	}
	return null;
}

function redirectHandleLoader(params: LoaderFunctionArgs) {
	const url = new URL(params.request.url);
	const token = url.searchParams.get('token');
	const type = url.searchParams.get('type');

	if (!type || !token) {
		return redirect('/login');
	}

	return redirect(REDIRECT_URLS[type as keyof typeof REDIRECT_URLS].replace(':token', token));
}

function organizationSelectLoader() {
	resetAfterOrgChange();
	useOrganizationStore.getState().reset();
	return null;
}

function clusterManagementLoader() {
	const user = useAuthStore.getState().user;

	if (!user.isClusterOwner) {
		return redirect('/401');
	}

	return null;
}

export default {
	homeLoader,
	redirectHandleLoader,
	organizationSelectLoader,
	clusterManagementLoader,
};
