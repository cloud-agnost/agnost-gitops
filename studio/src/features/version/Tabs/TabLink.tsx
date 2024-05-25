import { Button } from '@/components/Button';
import { useTabNavigate } from '@/hooks';
import { TabTypes } from '@/types';
import { cn } from '@/utils';
import { useLocation } from 'react-router-dom';
interface TabLinkProps {
	className?: string;
	name: string;
	path: string;
	type: TabTypes;
	onClick?: () => void;
}

export default function TabLink({ className, name, path, onClick, type, ...props }: TabLinkProps) {
	const navigate = useTabNavigate();
	const { pathname } = useLocation();

	function handleClickTabLink() {
		onClick?.();
		navigate({
			title: name,
			path: `${pathname}/${path}`,
			isActive: true,
			isDashboard: false,
			type,
		});
	}
	return (
		<Button
			variant='blank'
			onClick={handleClickTabLink}
			className={cn(className, 'link text-left !text-xs justify-start !min-w-[unset] truncate')}
			{...props}
		>
			{name}
		</Button>
	);
}
