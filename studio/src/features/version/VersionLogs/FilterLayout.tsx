import { Button } from '@/components/Button';
import { PopoverClose } from '@/components/Popover';
import { useColumnFilter } from '@/hooks';
import useUtilsStore from '@/store/version/utilsStore';
import { FieldTypes } from '@/types';
import { cn } from '@/utils';
import { FunnelSimple } from '@phosphor-icons/react';
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import _ from 'lodash';
import { useLocation } from 'react-router-dom';

export default function FilterLayout({
	children,
	onApply,
	columnName,
	onClear,
}: {
	columnName: string;
	children: React.ReactNode;
	onApply?: () => void;
	onClear?: () => void;
}) {
	const { pathname } = useLocation();
	const logType = pathname.split('/')[7];
	const { selectedFilter } = useColumnFilter(logType, columnName, FieldTypes.TEXT);
	const { clearColumnFilter } = useUtilsStore();
	function clearFilter() {
		onClear?.();
		clearColumnFilter(logType, columnName);
	}

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant='icon'
					size='sm'
					rounded
					className={cn(
						!_.isNil(selectedFilter) &&
							'bg-button-primary/90 dark:bg-button-primary/70 hover:bg-brand-darker dark:hover:bg-button-primary !text-white dark:text-default',
					)}
				>
					<FunnelSimple size={14} />
				</Button>
			</PopoverTrigger>
			<PopoverContent align='center' className='p-2 bg-subtle min-w-[210px] space-y-4'>
				{children}
				{onApply && (
					<PopoverClose asChild>
						<Button variant='primary' size='full' onClick={onApply}>
							Apply
						</Button>
					</PopoverClose>
				)}
				{selectedFilter && (
					<PopoverClose asChild>
						<Button variant='secondary' size='full' onClick={clearFilter}>
							Clear
						</Button>
					</PopoverClose>
				)}
			</PopoverContent>
		</Popover>
	);
}
