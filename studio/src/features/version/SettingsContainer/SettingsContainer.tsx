import { ReactNode } from 'react';
import { cn } from '@/utils';
import { Description } from '@/components/Description';

interface Props {
	children: ReactNode;
	pageTitle: string;
	action?: ReactNode;
	className?: string;
	description?: ReactNode;
}
export default function SettingsContainer({
	children,
	pageTitle,
	action,
	className,
	description,
}: Props) {
	return (
		<div className={cn('flex-1 full-height-without-header space-y-4 p-4', className)}>
			<Description className='max-w-2xl' title={pageTitle}>
				{description}
			</Description>
			{action && action}
			{children}
		</div>
	);
}
