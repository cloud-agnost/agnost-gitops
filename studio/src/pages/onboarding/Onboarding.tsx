import { OnboardingLayout } from '@/layouts/OnboardingLayout';
import useOnboardingStore from '@/store/onboarding/onboardingStore.ts';
import { Outlet, useNavigate } from 'react-router-dom';
import './onboarding.scss';

export default function Onboarding() {
	const { getPrevPath, goToPrevStep } = useOnboardingStore();
	const navigate = useNavigate();

	function goBack() {
		const prev = getPrevPath();
		if (prev) {
			goToPrevStep();
			navigate(prev);
		}
	}

	return (
		<OnboardingLayout>
			<div className='onboarding-page'>
				<Outlet context={{ goBack }} />
			</div>
		</OnboardingLayout>
	);
}
