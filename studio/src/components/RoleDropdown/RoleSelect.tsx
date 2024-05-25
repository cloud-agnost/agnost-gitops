import useTypeStore from '@/store/types/typeStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/Select';

interface RoleSelectProps {
	role: string;
	type: 'app' | 'org' | 'project';
	onSelect: (role: string) => void;
	disabled?: boolean;
}
function RoleSelect({ role, type, disabled, onSelect }: RoleSelectProps) {
	const { appRoles, orgRoles } = useTypeStore();
	const roles = type === 'org' ? orgRoles : appRoles;
	return (
		<Select defaultValue={role} onValueChange={onSelect} disabled={disabled}>
			<SelectTrigger className='w-[170px]'>
				<SelectValue>{role}</SelectValue>
			</SelectTrigger>

			<SelectContent>
				{roles?.map((role) => (
					<SelectItem key={role} value={role}>
						{role}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

export default RoleSelect;
