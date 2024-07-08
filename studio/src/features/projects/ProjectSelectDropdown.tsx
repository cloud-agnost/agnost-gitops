import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/Dropdown';
import { SelectionDropdown } from '@/components/SelectionDropdown';
import { PROJECT_SETTINGS } from '@/constants';
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
			<CreateProject className='!w-full justify-start' dropdown />
			{PROJECT_SETTINGS.map((setting, index) => (
				<>
					<DropdownMenuItem
						onClick={() => setting.onClick(project)}
						key={setting.name + index}
						disabled={setting.isDisabled(project.role, project)}
					>
						<setting.icon className='w-5 h-5 mr-2' />
						{setting.name}
					</DropdownMenuItem>
					{index === PROJECT_SETTINGS.length - 3 && <DropdownMenuSeparator key={setting.name} />}
				</>
			))}
		</SelectionDropdown>
	);
}
