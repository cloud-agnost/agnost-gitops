import { ElementType, ReactNode } from 'react';
import { cn } from '@/utils';

interface SettingsFormItemProps {
	title: string;
	description?: string | null;
	children?: ReactNode;
	className?: string;
	contentClassName?: string;
	twoColumns?: boolean;
	as?: ElementType;
}
export default function SettingsFormItem({
	title,
	description,
	children,
	contentClassName,
	className,
	twoColumns = false,
	as = 'div',
}: SettingsFormItemProps) {
	const Component = as;
	return (
		<Component
			className={cn(
				'space-y-6  max-w-2xl',
				twoColumns && 'flex justify-between gap-10',
				as === 'label' && 'cursor-pointer',
				className,
			)}
		>
			<div>
				<div className='text-sm leading-6 text-default tracking-tight font-medium'>{title}</div>
				{description && (
					<p className='text-subtle text-xs tracking-tight font-normal'>{description}</p>
				)}
			</div>
			<div className={contentClassName}>{children}</div>
		</Component>
	);
}
