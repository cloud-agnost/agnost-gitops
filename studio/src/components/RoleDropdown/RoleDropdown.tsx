import useTypeStore from '@/store/types/typeStore';
import { Funnel } from '@phosphor-icons/react';
import { Button } from '@/components/Button';
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from '@/components/Dropdown';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
interface RoleDropdownProps {
	type: 'project' | 'org';

	onChange: (roles: string[]) => void;
	value?: string[];
}
function RoleDropdown({ type, value, onChange }: Readonly<RoleDropdownProps>) {
	const { t } = useTranslation();
	const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
	const { orgRoles, projectRoles } = useTypeStore();
	const roles = type === 'project' ? projectRoles : orgRoles;

	useEffect(() => {
		if (value) {
			setSelectedRoles(value);
		}
	}, [value]);
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant='outline'>
					<Funnel size={16} weight='fill' className='members-filter-icon mr-2' />
					{selectedRoles.length > 0
						? t('general.selected', {
								count: selectedRoles.length,
						  })
						: t('general.filter')}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				{roles.map((role) => (
					<DropdownMenuCheckboxItem
						key={role}
						checked={selectedRoles.includes(role)}
						onCheckedChange={(checked) => {
							if (checked) {
								const newSelectedRoles = [...selectedRoles, role];
								setSelectedRoles(newSelectedRoles);
								onChange(newSelectedRoles);
							} else {
								const newSelectedRoles = selectedRoles.filter((r) => r !== role);
								setSelectedRoles(newSelectedRoles);
								onChange(newSelectedRoles);
							}
						}}
					>
						{role}
					</DropdownMenuCheckboxItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export default RoleDropdown;
