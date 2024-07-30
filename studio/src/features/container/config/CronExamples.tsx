import { Button } from '@/components/Button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuItemContainer,
	DropdownMenuTrigger,
} from '@/components/Dropdown';
import { CRON_EXAMPLES } from '@/constants';
import { describeCronExpression } from '@/utils';
import { CaretDown } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';

interface CronExamplesProps {
	selectCron: (cron: string) => void;
	children: React.ReactNode;
}

export default function CronExamples({ selectCron, children }: CronExamplesProps) {
	const triggerRef = useRef<HTMLDivElement>(null);
	const [triggerWidth, setTriggerWidth] = useState(0);

	useEffect(() => {
		if (triggerRef.current) {
			setTriggerWidth(triggerRef.current.offsetWidth);
		}
	}, [triggerRef.current]);
	return (
		<DropdownMenu>
			<div
				className='flex justify-between items-center rounded-sm bg-input-background pr-2'
				ref={triggerRef}
			>
				{children}
				<DropdownMenuTrigger className='block' asChild>
					<Button variant='icon' size='sm' rounded className='!p-1'>
						<CaretDown size={20} />
					</Button>
				</DropdownMenuTrigger>
			</div>
			<DropdownMenuContent
				align='end'
				className='bg-input-background w-full my-1 '
				style={{ width: triggerWidth }}
			>
				<DropdownMenuItemContainer className='min-w-full bg-input-background h-96 overflow-auto'>
					{CRON_EXAMPLES.map((cron) => (
						<DropdownMenuItem
							key={cron}
							className='hover:bg-subtle grid grid-cols-[1fr_3fr] gap-2'
							onClick={() => selectCron(cron)}
						>
							<p className='text-default text-xs whitespace-nowrap'>{cron}</p>
							<p className='text-subtle text-xs'>{describeCronExpression(cron)}</p>
						</DropdownMenuItem>
					))}
				</DropdownMenuItemContainer>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
