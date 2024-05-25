import { CommandItem } from '@/components/Command';
import { SelectionDropdown } from '@/components/SelectionDropdown';
import useProjectStore from '@/store/project/projectStore';
import { Project } from '@/types/project';
import _ from 'lodash';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CreateProject from './CreateProject';

export default function ProjectSelectDropdown() {
	const { projects, onProjectClick, project, openEditProjectDrawer, getProjects } =
		useProjectStore();
	const { orgId } = useParams();
	function onSelect(prj: Project) {
		if (prj._id === project?._id) return;
		onProjectClick(prj);
	}

	useEffect(() => {
		if (_.isEmpty(projects) && orgId) {
			getProjects(orgId);
		}
	}, [orgId]);
	return (
		<SelectionDropdown<Project>
			selectedData={project as Project}
			data={projects}
			onSelect={(prj) => onSelect(prj as Project)}
			onClick={() => openEditProjectDrawer(project as Project)}
		>
			<CommandItem>
				<CreateProject className='!w-full' />
			</CommandItem>
		</SelectionDropdown>
	);
}
