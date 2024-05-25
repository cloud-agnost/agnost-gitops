import { CommandItem } from '@/components/Command';
import { SelectionDropdown } from '@/components/SelectionDropdown';
import useApplicationStore from '@/store/app/applicationStore';
import { Application } from '@/types';
import _ from 'lodash';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CreateApplicationButton } from '..';
import './appSelectDropdown.scss';

export default function ApplicationSelectDropdown() {
	const { applications, application, openEditAppDrawer, getAppsByOrgId } = useApplicationStore();
	const { onAppClick } = useApplicationStore();
	const { orgId } = useParams();
	function onSelect(app: Application) {
		if (app._id === application?._id) return;
		onAppClick(app);
	}

	useEffect(() => {
		if (_.isEmpty(applications) && orgId) {
			getAppsByOrgId(orgId);
		}
	}, [orgId]);

	return (
		<>
			<SelectionDropdown<Application>
				selectedData={application as Application}
				data={applications}
				onSelect={(app) => onSelect(app as Application)}
				onClick={() => openEditAppDrawer(application as Application)}
			>
				<CommandItem>
					<CreateApplicationButton size='full' />
				</CommandItem>
			</SelectionDropdown>
		</>
	);
}
