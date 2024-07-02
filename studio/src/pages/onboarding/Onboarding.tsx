import { Outlet } from 'react-router-dom';

export default function Onboarding() {
	return (
		<div className='container px-4 relative h-[100dvh] flex flex-col justify-center'>
			<Outlet />
		</div>
	);
}
