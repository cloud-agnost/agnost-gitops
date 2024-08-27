import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/Dropdown';
import { SelectionDropdown } from '@/components/SelectionDropdown';
import { PROJECT_SETTINGS } from '@/constants';
import useProjectStore from '@/store/project/projectStore';
import { Project } from '@/types/project';
import { isEmpty } from 'lodash';
import { Fragment, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import CreateProject from './CreateProject';
import { Plus } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
export default function ProjectSelectDropdown() {
	const { projects, onProjectClick, project, openEditProjectDrawer, getProjects } =
		useProjectStore();
	const { t } = useTranslation();
	const { orgId } = useParams();
	const [openCreateProject, setOpenCreateProject] = useState(false);
	const [_, setSearchParams] = useSearchParams();
	function onSelect(prj: Project) {
		if (prj._id === project?._id) return;
		onProjectClick(prj);
	}

	useEffect(() => {
		if (isEmpty(projects) && orgId) {
			getProjects(orgId);
		}
	}, [orgId]);
	return (
		<>
			<CreateProject dropdown open={openCreateProject} onOpenChange={setOpenCreateProject} />
			<SelectionDropdown<Project>
				selectedData={project as Project}
				data={projects}
				onSelect={(prj) => onSelect(prj as Project)}
				onClick={() => openEditProjectDrawer(project as Project)}
			>
				<DropdownMenuItem onClick={() => setOpenCreateProject(true)}>
					<Plus size={20} className='mr-2' />
					{t('project.create')}
				</DropdownMenuItem>
				{PROJECT_SETTINGS.map((setting, index) => (
					<Fragment key={setting.name}>
						<DropdownMenuItem
							onClick={() => {
								if (setting.id === 'update') setSearchParams({ st: 'general' });
								setting.onClick(project);
							}}
							disabled={setting.isDisabled(project.role, project)}
						>
							<setting.icon className='w-5 h-5 mr-2' />
							{setting.name}
						</DropdownMenuItem>
						{index === PROJECT_SETTINGS.length - 3 && <DropdownMenuSeparator key={setting.name} />}
					</Fragment>
				))}
			</SelectionDropdown>
		</>
	);
}
