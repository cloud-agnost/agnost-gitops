import './notifications.scss';
import { ALL_NOTIFICATIONS } from '@/constants';
import { NotificationItem } from '@/features/auth/Notifications/index.ts';
import useAuthStore from '@/store/auth/authStore.ts';
import { useState } from 'react';
import { APIError } from '@/types';
import { Alert, AlertDescription, AlertTitle } from 'components/Alert';

export default function Notifications() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<APIError | null>(null);
	const { user, updateNotifications } = useAuthStore();
	const [notifications, setNotifications] = useState<string[]>(user?.notifications || []);
	const [allNotificationsIsActive, setAllNotificationsIsActive] = useState(
		ALL_NOTIFICATIONS.length === notifications.length,
	);

	async function onCheckedChange(notification: string, status: boolean) {
		const notifications = new Set<string>(user?.notifications || []);

		if (status) notifications.add(notification);
		else notifications.delete(notification);

		await handler(Array.from(notifications));
	}

	async function handler(notifications: string[]) {
		try {
			setLoading(true);
			setError(null);
			const user = await updateNotifications(notifications);
			setNotifications(user.notifications);
		} catch (e) {
			setError(e as APIError);
		} finally {
			setLoading(false);
		}
	}

	async function allChanged(_: string, active: boolean) {
		setAllNotificationsIsActive(active);
		await handler(active ? ALL_NOTIFICATIONS : []);
	}

	return (
		<div className='flex flex-col gap-y-4 w-full md:max-w-[464px]' aria-disabled={loading}>
			{error && (
				<Alert variant='error'>
					<AlertTitle>{error.error}</AlertTitle>
					<AlertDescription>{error.details}</AlertDescription>
				</Alert>
			)}
			<NotificationItem
				onChange={allChanged}
				checked={allNotificationsIsActive}
				notification='all'
			/>
			{ALL_NOTIFICATIONS.map((notification) => (
				<NotificationItem
					onChange={onCheckedChange}
					checked={notifications.includes(notification)}
					notification={notification}
					key={notification}
				/>
			))}
		</div>
	);
}
