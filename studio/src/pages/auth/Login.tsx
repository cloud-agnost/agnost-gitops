import { AuthLayout } from '@/layouts/AuthLayout';
import { APIError } from '@/types';
import { useLoaderData } from 'react-router-dom';

export default function Login() {
	const error = useLoaderData() as APIError | undefined;

	return (
		<AuthLayout
			title='Sign In'
			subtitle='Choose one of the available authentication providers to sign in.'
			error={error}
		/>
	);
}
