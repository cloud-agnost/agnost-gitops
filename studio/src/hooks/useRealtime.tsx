import { NOTIFICATION_ACTIONS } from '@/constants';
import { realtimeObjectMapper } from '@/helpers/realtime';
import useAuthStore from '@/store/auth/authStore';
import useVersionStore from '@/store/version/versionStore';
import { NotificationActions } from '@/types';
import { DATE_TIME_FORMAT_WITH_MS, formatDate, generateId, onChannelMessage } from '@/utils';
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
					let currentNotf = useVersionStore.getState().notificationsPreview;
					if (currentNotf.length >= 100) currentNotf.shift();
					useVersionStore.setState({
						notificationsPreview: [
							{
								_id: generateId(),
								...identifiers,
								orgId: identifiers.orgId as string,
								appId: identifiers.appId as string,
								versionId: identifiers.versionId as string,
								object,
								action: action as NotificationActions,
								actor: message.actor,
								description: message.description,
								data,
								createdAt: new Date(timestamp).toISOString(),
								__v: 0,
							},
							...currentNotf,
						],
					});
				}
			}
		});

		return () => {
			cb();
		};
	}, []);
}
