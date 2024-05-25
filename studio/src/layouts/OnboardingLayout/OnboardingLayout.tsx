import { Logo } from '@/components/Logo';
import { ReactNode } from 'react';
import './OnboardingLayout.scss';
import { Stepper } from '@/components/Stepper';

type OnboardingLayoutProps = {
	children: ReactNode;
};

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
	return (
		<div className='onboarding-layout'>
			<div className='onboarding-layout-left'>
				<Logo className='onboarding-layout-app-logo' />
				<Stepper />
			</div>
			<div className='onboarding-layout-right'>{children}</div>
		</div>
	);
}
