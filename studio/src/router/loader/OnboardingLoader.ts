import { resetAllStores } from '@/helpers';
import useAuthStore from '@/store/auth/authStore';
import useClusterStore from '@/store/cluster/clusterStore';
import useOnboardingStore from '@/store/onboarding/onboardingStore';
import useTypeStore from '@/store/types/typeStore';
import { LoaderFunctionArgs, redirect } from 'react-router-dom';

async function accountInformationLoader() {
	resetAllStores();
	return {};
}
async function inviteTeamMembersLoader() {
	const { isTypesOk, getAllTypes } = useTypeStore.getState();
	if (!isTypesOk) {
		getAllTypes();
	}
	return null;
}
async function onboardingLoader(params: LoaderFunctionArgs) {
	const status = await useClusterStore.getState().checkClusterSetup();
	useClusterStore.getState().checkClusterSmtpStatus();
	const { currentStepIndex, steps } = useOnboardingStore.getState();
	const isAuthenticated = useAuthStore.getState().isAuthenticated();

	if (status) {
		return redirect(isAuthenticated ? '/organization' : '/login');
	}

	const url = new URL(params.request.url);
	const lastDoneStep = steps[currentStepIndex];

	if (lastDoneStep && lastDoneStep.path !== url.pathname) {
		// return redirect(lastDoneStep.path);
	}

	return null;
}

async function createAppLoader() {
	const { checkDomainStatus } = useClusterStore.getState();
	let domainStatus = true;
	try {
		await checkDomainStatus();
	} catch (error) {
		domainStatus = false;
	}
	return { domainStatus };
}

export default {
	accountInformationLoader,
	inviteTeamMembersLoader,
	onboardingLoader,
	createAppLoader,
};
