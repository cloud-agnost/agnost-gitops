import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/Accordion';
import { cn } from '@/utils';
import { CaretDown } from '@phosphor-icons/react';
import React from 'react';
import { Trans } from 'react-i18next';

interface DescriptionProps {
	title: string;
	descriptionI18nKey?: string;
	children: React.ReactNode;
	icon: React.ReactNode;
}

export default function ContainerFormTitle({
	children,
	title,
	descriptionI18nKey,
	icon,
}: DescriptionProps) {
	return (
		<div className='flex items-center gap-4'>
			<div className='bg-subtle dark:bg-base rounded-full p-2 self-start'>{icon}</div>
			<Accordion
				type='multiple'
				className='w-full'
				defaultValue={['General', 'Networking', 'Source']}
			>
				<AccordionItem value={title} className='space-y-6 border-none'>
					<AccordionTrigger className={cn('text-justify !p-0 flex items-center justify-between')}>
						<h2 className='text-default text-sm	leading-8 font-semibold font-sfCompact'>{title}</h2>
						<CaretDown
							size={20}
							className='shrink-0 self-start text-icon-base transition-transform duration-200 group-data-[state=open]:rotate-180'
						/>
					</AccordionTrigger>
					<AccordionContent className='overflow-visible'>
						<div className='space-y-6'>
							{' '}
							<div className='text-xs text-subtle font-normal leading-6 font-sfCompact'>
								{descriptionI18nKey && (
									<Trans i18nKey={descriptionI18nKey} components={{ 1: <br /> }} />
								)}
							</div>
							{children}
						</div>
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	);
}
