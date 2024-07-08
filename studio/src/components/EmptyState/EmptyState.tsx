import { cn } from '@/utils';
import { Bell, Envelope, ShippingContainer, Users } from '@phosphor-icons/react';
import { ProjectorScreenChart } from '@phosphor-icons/react/dist/ssr';
import React, { ElementType } from 'react';

export type Modules = 'org' | 'invitation' | 'project' | 'container' | 'notification';
interface EmptyStateProps {
	title: string;
	children?: React.ReactNode;
	type: Modules;
	className?: string;
}

export default function EmptyState({ type, title, className, children }: EmptyStateProps) {
	const ICON_MAP: Record<string, ElementType> = {
		invitation: Envelope,
		org: Users,
		notification: Bell,
		project: ProjectorScreenChart,
		container: ShippingContainer,
	};
	const Icon = ICON_MAP[type];

	return (
		<div className={cn('flex flex-col items-center justify-center gap-4 h-[95%]', className)}>
			<div className='border-2 border-border p-4 rounded-full bg-border'>
				{<Icon className='w-8 h-8 text-default' />}
			</div>
			<h2 className='text-default text-xs font-normal leading-6 '>{title}</h2>
			{children}
		</div>
	);
}
