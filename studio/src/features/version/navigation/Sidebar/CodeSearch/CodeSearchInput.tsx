import useVersionStore from '@/store/version/versionStore';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/Tooltip';
import { TextAa, TextAlignJustify, X } from '@phosphor-icons/react';
import { cn } from '@/utils';
import { useTranslation } from 'react-i18next';

export default function CodeSearchInput() {
	const { t } = useTranslation();
	const {
		setCodeSearchTerm,
		toggleMatchCase,
		toggleMatchWholeWord,
		codeSearchTerm,
		matchCase,
		matchWholeWord,
	} = useVersionStore();

	function clearResults() {
		setCodeSearchTerm('');
		useVersionStore.setState({ searchCodeResult: [] });
	}

	return (
		<div className='relative p-2'>
			<Input
				variant='sm'
				placeholder='Search'
				value={codeSearchTerm}
				onChange={(e) => setCodeSearchTerm(e.target.value)}
			/>
			<div className='flex items-center absolute top-1/2 transform -translate-y-1/2 right-2 mr-1 gap-1'>
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant={matchCase ? 'primary' : 'blank'}
								className={cn(
									'hover:bg-wrapper-background-hover dark:hover:bg-button-border-hover aspect-square text-icon-base hover:text-default !p-0 !h-6',
								)}
								iconOnly
								size='sm'
								onClick={clearResults}
							>
								<X size={16} />
							</Button>
						</TooltipTrigger>
						<TooltipContent>{t('general.clear')}</TooltipContent>
					</Tooltip>
				</TooltipProvider>
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant={matchCase ? 'primary' : 'blank'}
								className={cn(
									'hover:bg-wrapper-background-hover dark:hover:bg-button-border-hover aspect-square text-icon-base hover:text-default !p-0 !h-6',
								)}
								iconOnly
								size='sm'
								onClick={toggleMatchCase}
							>
								<TextAa size={16} />
							</Button>
						</TooltipTrigger>
						<TooltipContent>{t('version.match_case')}</TooltipContent>
					</Tooltip>
				</TooltipProvider>
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant={matchWholeWord ? 'primary' : 'blank'}
								iconOnly
								size='sm'
								onClick={toggleMatchWholeWord}
								className='hover:bg-wrapper-background-hover dark:hover:bg-button-border-hover aspect-square text-icon-base hover:text-default !p-0 !h-6'
							>
								<TextAlignJustify size={16} />
							</Button>
						</TooltipTrigger>
						<TooltipContent align='end'>{t('version.match_whole_word')}</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>
		</div>
	);
}
