import ChangeProjectAvatar from './Settings/ChangeProjectAvatar';
import ChangeProjectName from './Settings/ChangeProjectName';
import TransferProject from './Settings/TransferProject';

export default function ProjectGeneralSettings() {
	return (
		<div className='space-y-6 p-6'>
			<ChangeProjectName />
			<ChangeProjectAvatar />
			<TransferProject />
		</div>
	);
}
