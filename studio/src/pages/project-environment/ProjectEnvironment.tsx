import useApplicationStore from '@/store/app/applicationStore';
import useProjectEnvironmentStore from '@/store/project/projectEnvironmentStore';
import useProjectStore from '@/store/project/projectStore';
import { joinChannel } from '@/utils';
import _ from 'lodash';
import { useEffect } from 'react';
import { Outlet, useParams } from 'react-router-dom';

export default function ProjectEnvironment() {
	const { projectId, orgId, envId } = useParams() as Record<string, string>;
	const {} = useApplicationStore();
	const { project, getProjectById } = useProjectStore();
	const { getProjectEnvironmentById } = useProjectEnvironmentStore();

	useEffect(() => {
		if (_.isEmpty(project)) {
			getProjectById(orgId as string, projectId as string);
		} else {
			joinChannel(projectId as string);
		}
	}, [projectId]);

	useEffect(() => {
		getProjectEnvironmentById({
			projectId: projectId as string,
			orgId: orgId as string,
			envId: envId as string,
		});
	}, [envId]);
	return (
		<div className='full-height-without-header-and-tab overflow-auto' id='env-layout'>
			<Outlet />
		</div>
	);
}
