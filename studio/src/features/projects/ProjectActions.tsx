import { Button, ButtonGroup } from '@/components/Button';
import { SearchInput } from '@/components/SearchInput';
import useProjectStore from '@/store/project/projectStore';
import { cn } from '@/utils';
import { List, SquaresFour } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import CreateProject from './CreateProject';

interface AProjectActionsProps {
	isCard: boolean;
	setIsCard: (value: boolean) => void;
}

export default function ProjectActions({ isCard, setIsCard }: AProjectActionsProps) {
	const { t } = useTranslation();
	const { projects } = useProjectStore();
	const [searchParams] = useSearchParams();
	return (
		<div className='flex  items-center justify-between'>
			<h1 className='text-default text-lg font-semibold text-center'>
				{projects.length} {t('project.projects')}
			</h1>
			<div className='flex items-center justify-center gap-6'>
				<SearchInput placeholder='Search apps' value={searchParams.get('q') as string} />
				<ButtonGroup>
					<Button
						size='sm'
						iconOnly
						variant='blank'
						className={cn(
							isCard ? 'border border-border shadow-md' : 'bg-subtle',
							'transition-all',
						)}
						onClick={() => setIsCard(true)}
					>
						<SquaresFour
							size={14}
							className={cn(isCard ? 'text-icon-secondary' : 'text-icon-base')}
						/>
					</Button>
					<Button
						size='sm'
						iconOnly
						variant='blank'
						className={cn(
							!isCard ? 'border border-border shadow-md' : 'bg-subtle',
							'transition-all',
						)}
						onClick={() => setIsCard(false)}
					>
						<List size={14} className={cn(!isCard ? 'text-icon-secondary' : 'text-icon-base')} />
					</Button>
				</ButtonGroup>
				<CreateProject />
			</div>
		</div>
	);
}
