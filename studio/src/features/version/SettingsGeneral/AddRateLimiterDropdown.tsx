import { Button } from '@/components/Button';
import { CreateRateLimit } from '@/features/version/SettingsGeneral';
import { RateLimit } from '@/types';
import { cn } from '@/utils';
import { CaretDown, CaretUp, Plus } from '@phosphor-icons/react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuItemContainer,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from 'components/Dropdown';
import _ from 'lodash';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface AddRateLimiterDropdownProps {
	options: RateLimit[] | undefined;
	onSelect: (limiter: RateLimit) => void;
	hasToAddAsDefault?: 'endpoint' | 'realtime';
	disabled?: boolean;
}

export default function AddRateLimiterDropdown({
	options,
	onSelect,
	hasToAddAsDefault,
	disabled,
}: AddRateLimiterDropdownProps) {
	const [addRateLimiterDropDownIsOpen, setAddRateLimiterDropDownIsOpen] = useState(false);
	const [addRateLimitDrawerIsOpen, setAddRateLimitDrawerIsOpen] = useState(false);
	const { t } = useTranslation();

	return (
		<>
			<DropdownMenu
				open={addRateLimiterDropDownIsOpen}
				onOpenChange={setAddRateLimiterDropDownIsOpen}
			>
				<DropdownMenuTrigger asChild disabled={disabled}>
					<Button variant='secondary' className='flex items-center gap-[10px]'>
						<Plus size={14} />
						{t('version.add_rate_limiter')}
						{addRateLimiterDropDownIsOpen ? <CaretUp size={14} /> : <CaretDown size={14} />}
					</Button>
				</DropdownMenuTrigger>

				<DropdownMenuContent align='end' className='version-dropdown-content bg-input-background'>
					<DropdownMenuItemContainer
						className={cn(_.isNil(hasToAddAsDefault) && 'bg-input-background')}
					>
						<DropdownMenuItem
							onClick={() => setAddRateLimitDrawerIsOpen(true)}
							className={cn(
								_.isNil(hasToAddAsDefault) && 'hover:bg-lighter dark:hover:bg-[#343B4D]',
								'gap-[10px] text-xs',
							)}
						>
							<Plus size={14} />
							<span>{t('version.add_new_limiter')}</span>
						</DropdownMenuItem>
						{options && options.length > 1 && <DropdownMenuSeparator />}

						{options?.map((limiter, index) => (
							<DropdownMenuItem
								onClick={() => onSelect(limiter)}
								key={index}
								className={cn(
									_.isNil(hasToAddAsDefault) && 'hover:bg-lighter dark:hover:bg-[#343B4D]',
									'gap-[10px] text-xs ',
								)}
							>
								<p className='text-xs'>{limiter.name}</p>
								<p className='text-xs text-subtle leading-[21px]'>
									{t('version.limiter_detail', {
										rate: limiter.rate,
										duration: limiter.duration,
									})}
								</p>
							</DropdownMenuItem>
						))}
					</DropdownMenuItemContainer>
				</DropdownMenuContent>
			</DropdownMenu>
			<CreateRateLimit
				type={hasToAddAsDefault}
				onCreate={onSelect}
				key={addRateLimitDrawerIsOpen.toString()}
				open={addRateLimitDrawerIsOpen}
				onOpenChange={setAddRateLimitDrawerIsOpen}
			/>
		</>
	);
}
