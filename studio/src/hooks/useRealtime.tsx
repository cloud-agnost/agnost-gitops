import { NOTIFICATION_ACTIONS } from '@/constants';
import { realtimeObjectMapper } from '@/helpers/realtime';
import useAuthStore from '@/store/auth/authStore';
import { DATE_TIME_FORMAT_WITH_MS, formatDate, onChannelMessage } from '@/utils';
import { useEffect } from 'react';

export default function useRealtime() {
	const user = useAuthStore((state) => state.user);
	useEffect(() => {
		const cb = onChannelMessage('notification', (message) => {
			const { data, object, action, identifiers, timestamp, message: log, id, type } = message;
			if (message?.actor?.userId !== user?._id || action !== 'create') {
				const fn = realtimeObjectMapper(object);

				if (!(action in fn)) return;
				//@ts-expect-error - this is a valid call
				fn[action]({
					data,
					identifiers,
					timestamp: formatDate(timestamp, DATE_TIME_FORMAT_WITH_MS),
					message: log,
					...(id && { id }),
					type,
					actor: message.actor,
				});
				if (NOTIFICATION_ACTIONS.includes(action)) {
					// add notf preview
				}
			}
		});

		return () => {
			cb();
		};
	}, []);
}
