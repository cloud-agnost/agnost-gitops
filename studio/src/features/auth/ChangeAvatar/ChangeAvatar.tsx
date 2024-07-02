import { ChangeAvatar } from '@/components/ChangeAvatar';
import useAuthStore from '@/store/auth/authStore.ts';
import { APIError } from '@/types';
import { useState } from 'react';
export default function ChangeUserAvatar() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<APIError | null>(null);
	const { user, changeAvatar, removeAvatar } = useAuthStore();

	async function onChangeHandler(file: File) {
		try {
			setError(null);
			setLoading(true);
			await changeAvatar(file);
		} catch (error) {
			setError(error as APIError);
		} finally {
			setLoading(false);
		}
	}

	async function removeHandler() {
		try {
			setError(null);
			setLoading(true);
			await removeAvatar();
		} catch (error) {
			setError(error as APIError);
		} finally {
			setLoading(false);
		}
	}

	return (
		<ChangeAvatar
			item={{
				name: user?.name as string,
				color: user?.color as string,
				pictureUrl: user?.pictureUrl as string,
				_id: user?._id as string,
			}}
			onChange={onChangeHandler}
			removeAvatar={removeHandler}
			error={error}
			loading={loading}
			className='flex items-center gap-32'
			userAvatar
		/>
	);
}
