import { APPLICATION_SETTINGS } from '@/constants';
import { AppRoles, Application } from '@/types';
import { Project } from '@/types/project';
import { DotsThreeVertical } from '@phosphor-icons/react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuItemContainer,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from 'components/Dropdown';

interface ApplicationSettingsProps {
	application: Application | Project;
	role: AppRoles;
	settings: any[];
}

export default function ApplicationSettings({
	application,
	role,
	settings,
}: ApplicationSettingsProps) {
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
					{settings.map((setting, index) => (
						<div key={setting.id}>
							<DropdownMenuItem
								id={setting.id}
								disabled={setting.isDisabled(role, application)}
								className='font-sfCompact px-3'
								onClick={() => setting.onClick(application)}
							>
								<setting.icon className='w-5 h-5 mr-2' />
								{setting.name}
							</DropdownMenuItem>
							{index === APPLICATION_SETTINGS.length - 3 && (
								<DropdownMenuSeparator key={setting.name} />
							)}
						</div>
					))}
				</DropdownMenuItemContainer>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
