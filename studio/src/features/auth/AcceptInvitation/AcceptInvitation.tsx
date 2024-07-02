import { AuthLayout } from '@/layouts/AuthLayout';
import { APIError } from '@/types';
import { useLoaderData } from 'react-router-dom';

export default function AcceptInvitation({ type }: { type: 'project' | 'org' }) {
	const error = useLoaderData() as APIError | undefined;

	return (
		<AuthLayout
			title='Accept Invitation'
			subtitle={`You have been invited to join a ${type}!`}
			error={error}
		/>
	);
}
