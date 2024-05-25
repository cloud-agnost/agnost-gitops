import { cn } from '@/utils';
import { useState } from 'react';
import { PanelResizeHandle, PanelResizeHandleProps } from 'react-resizable-panels';
import { Separator } from '../Separator';

interface ResizerProps extends PanelResizeHandleProps {
	hide?: boolean;
	orientation: 'horizontal' | 'vertical';
}
export default function Resizer({ hide, orientation, className, ...props }: ResizerProps) {
	const [isResizing, setIsResizing] = useState(false);
	return (
		<PanelResizeHandle
			{...props}
			className={cn(
				//Todo add css variables
				'flex items-center justify-center group gap-0.5 bg-subtle/50 dark:bg-[#171d2d]',
				orientation === 'horizontal' ? 'flex-col h-2 !cursor-row-resize' : 'w-2 !cursor-col-resize',
				className,
			)}
			onDragging={(val) => {
				if (isResizing !== val) setIsResizing(val);
			}}
		>
			{!hide && (
				<>
					<Separator className='bg-subtle' orientation={orientation} />
					<div
						className={cn(
							'rounded',
							orientation === 'vertical' ? 'h-8 w-0.5' : 'h-0.5 w-8',
							isResizing
								? 'active-resizer'
								: 'bg-wrapper-background-hover group-hover:bg-base-reverse',
							isResizing && orientation === 'horizontal' && 'w-full',
							isResizing && orientation === 'vertical' && 'h-full',
						)}
					/>
					<Separator className='bg-subtle' orientation={orientation} />
				</>
			)}
		</PanelResizeHandle>
	);
}
