import { PROJECT_SETTINGS } from '@/constants';
import { Project, ProjectRole } from '@/types/project';
import { DotsThreeVertical } from '@phosphor-icons/react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuItemContainer,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from 'components/Dropdown';

interface ProjectSettingsProps {
	project: Project;
	role: ProjectRole;
}
export default function ProjectSettings({ project, role }: ProjectSettingsProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
				<div className='size-7 hover:bg-wrapper-background-hover rounded-full flex items-center justify-center cursor-pointer'>
					<DotsThreeVertical className='size-5 text-icon-secondary' />
				</div>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align='end'
				className='version-dropdown-content'
				onClick={(e) => e.stopPropagation()}
			>
				<DropdownMenuItemContainer>
					{PROJECT_SETTINGS.map((setting, index) => (
						<div key={setting.id}>
							<DropdownMenuItem
								id={setting.id}
								disabled={setting.isDisabled(role, project)}
								className=' px-3'
								onClick={() => setting.onClick(project)}
							>
								<setting.icon className='w-5 h-5 mr-2' />
								{setting.name}
							</DropdownMenuItem>
							{index === PROJECT_SETTINGS.length - 3 && (
								<DropdownMenuSeparator key={setting.name} />
							)}
						</div>
					))}
				</DropdownMenuItemContainer>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
