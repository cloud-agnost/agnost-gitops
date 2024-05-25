import { RequireAuth } from '@/router';

export default function Home() {
	return (
		<RequireAuth>
			<div>Home</div>
		</RequireAuth>
	);
}
