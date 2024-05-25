import useOnboardingStore from '@/store/onboarding/onboardingStore.ts';
import { cn } from '@/utils';
import './Stepper.scss';

interface StepperProps {
	classname?: string;
}

export default function Stepper({ classname }: StepperProps) {
	const { currentStepIndex, steps } = useOnboardingStore();
	return (
		<ol className={cn('auth-stepper', classname)}>
			{steps.map(({ text, isDone }, index) => (
				<li
					key={index}
					className='auth-stepper-item'
					data-is-active={currentStepIndex === index}
					data-is-done={isDone}
				>
					<div className='auth-stepper-item-wrapper'>
						<span className='auth-stepper-item-number'>
							{isDone ? (
								<svg
									width='16'
									height='12'
									viewBox='0 0 16 12'
									fill='none'
									xmlns='http://www.w3.org/2000/svg'
								>
									<path
										d='M14.875 1.6333L6.125 10.3829L1.75 6.0083'
										stroke='currentColor'
										strokeWidth='2'
										strokeLinecap='round'
										strokeLinejoin='round'
									/>
								</svg>
							) : (
								index + 1
							)}
						</span>
						<div className='auth-stepper-item-text'>
							<h3>{text}</h3>
							{index > 2 && <p className='auth-stepper-item-description italic'>Optional</p>}
						</div>
					</div>

					{index !== steps.length - 1 ? (
						<div className='w-7 my-1 flex justify-center'>
							<div className='dark:bg-lighter w-[2px] h-8' />
						</div>
					) : null}
				</li>
			))}
		</ol>
	);
}
