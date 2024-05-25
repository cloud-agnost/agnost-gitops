import { cva } from 'class-variance-authority';
import { cn } from '@/utils';
import { X } from '@phosphor-icons/react';
import './badge.scss';
import { Button } from '@/components/Button';
const badgeVariants = cva('badge', {
	variants: {
		variant: {
			green: 'badge-green',
			blue: 'badge-blue',
			yellow: 'badge-yellow',
			purple: 'badge-purple',
			red: 'badge-red',
			orange: 'badge-orange',
			gray: 'badge-gray',
			default: 'badge',
		},
		rounded: {
			true: 'badge-rounded',
		},
	},
	defaultVariants: {
		variant: 'gray',
		rounded: false,
	},
});

export type BadgeColors = 'green' | 'blue' | 'yellow' | 'purple' | 'red' | 'orange' | 'gray';

interface BadgeProps {
	variant?: BadgeColors;
	rounded?: boolean;
	text: string;
	className?: string;
	onClear?: () => void;
}
export default function Badge({ text, variant, rounded, onClear, className }: BadgeProps) {
	return (
		<div className={cn(badgeVariants({ variant, rounded }), className)}>
			{rounded && variant !== 'gray' && <div className='badge-dot' />}
			<span className={cn('badge-text')}>{text}</span>
			{onClear && (
				<Button
					variant='icon'
					size='sm'
					rounded
					className='badge-clear p-0 h-4 w-4 text-default'
					onClick={onClear}
				>
					<X size={12} />
				</Button>
			)}
		</div>
	);
}
