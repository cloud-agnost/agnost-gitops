import { Button } from '@/components/Button';
import { useTabIcon } from '@/hooks';
import useAuthStore from '@/store/auth/authStore';
import useThemeStore from '@/store/theme/themeStore';
import { TabTypes } from '@/types';
import { cn } from '@/utils';
import React from 'react';

interface SideBarButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
	active: boolean;
	className?: string;
	children?: React.ReactNode;
	actions?: React.ReactNode;
	asChild?: boolean;
	type?: TabTypes;
	title?: string;
	caret?: boolean;
	caretActive?: boolean;
}

export default function SideBarButton({
	active,
	className,
	children,
	title,
	type,
	actions,
	asChild,
	...props
}: SideBarButtonProps) {
	const getIcon = useTabIcon('w-3.5 h-3.5');
	const { getTheme } = useThemeStore();
	const user = useAuthStore((state) => state.user);
	return (
		<div
			className={cn(
				'flex items-center [&>*]:min-w-0 justify-between gap-1 group',
				active
					? 'bg-button-primary/90 dark:bg-button-primary/70 text-default'
					: 'hover:bg-lighter text-subtle hover:text-default',
			)}
		>
			<Button
				{...props}
				variant='blank'
				size='full'
				className={cn(
					'justify-start text-left gap-2 text-xs font-normal cursor-pointer !h-6 !rounded-none whitespace-nowrap  pl-5 flex-1',
					className,
				)}
			>
				{!asChild ? (
					<>
						<div
							className={cn(
								'flex-1/2',
								active && getTheme(user._id) === 'light' && '[&>svg]:text-white',
							)}
						>
							{getIcon(type as TabTypes)}
						</div>
						<h1
							title={title}
							className={cn(
								'truncate font-sfCompact text-subtle',
								active ? 'text-white dark:text-default' : 'text-subtle group-hover:text-default',
							)}
						>
							{title}
						</h1>
					</>
				) : (
					children
				)}
			</Button>
			<div className='flex items-center mr-2'>{actions}</div>
		</div>
	);
}
