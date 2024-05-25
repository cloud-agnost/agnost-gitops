import TransferProject from '@/features/projects/Settings/TransferProject';
import ChangeAppAvatar from './General/ChangeAppAvatar';
import ChangeAppName from './General/ChangeAppName';

export default function AppGeneralSettings() {
	return (
		<div className='space-y-6 p-6'>
			<ChangeAppName />
			<ChangeAppAvatar />
			<TransferProject />
		</div>
	);
}
