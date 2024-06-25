import { Outlet } from 'react-router-dom';

export default function Onboarding() {
	return (
		<div className='container px-4 relative h-[100dvh] flex-col items-center justify-center grid lg:max-w-none lg:px-0'>
			<Outlet />
		</div>
	);
}
