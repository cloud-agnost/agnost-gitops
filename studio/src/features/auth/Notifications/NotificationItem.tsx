import { Switch } from 'components/Switch';
import { useTranslation } from 'react-i18next';

interface NotificationItemProps {
	notification: string;
	checked: boolean;
	onChange: (notification: string, status: boolean) => void;
}
export default function NotificationItem({
	notification,
	onChange,
	checked,
}: NotificationItemProps) {
	const { t } = useTranslation();

	return (
		<label className='flex justify-between gap-4 cursor-pointer hover:bg-subtle p-2 -ml-2 transition rounded-sm'>
			<span className='text-default text-sm font-sfCompact font-medium leading-6 select-none'>
				{t(`profileSettings.${notification}_notification`)}
			</span>
			<Switch
				checked={checked}
				onCheckedChange={(_isActive) => onChange(notification, _isActive)}
			/>
		</label>
	);
}
