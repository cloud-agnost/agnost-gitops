import useTypeStore from '@/store/types/typeStore';
import { Funnel } from '@phosphor-icons/react';
import { Button } from '@/components/Button';
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from 'components/Dropdown';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
interface RoleDropdownProps {
	type: 'app' | 'org';

	onChange: (roles: string[]) => void;
	value?: string[];
}
function RoleDropdown({ type, value, onChange }: RoleDropdownProps) {
	const { t } = useTranslation();
	const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
	const { appRoles, orgRoles } = useTypeStore();
	const roles = type === 'app' ? appRoles : orgRoles;

	useEffect(() => {
		if (value) {
			setSelectedRoles(value);
		}
	}, [value]);
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant='secondary'>
					<Funnel size={16} weight='fill' className='members-filter-icon' />
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
