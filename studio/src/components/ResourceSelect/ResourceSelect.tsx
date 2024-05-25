import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';
import { RESOURCE_ICON_MAP } from '@/constants';
import useResourceStore from '@/store/resources/resourceStore';
import { SelectProps } from '@radix-ui/react-select';
import { useTranslation } from 'react-i18next';
import { FormControl } from '../Form';
import { useEffect } from 'react';
import { ResourceType } from '@/types';
import { cn } from '@/utils';
import { useParams } from 'react-router-dom';
interface ResourceSelectProps extends SelectProps {
	error: boolean;
	type: ResourceType;
	className?: string;
}
export default function ResourceSelect({ error, type, className, ...props }: ResourceSelectProps) {
	const { t } = useTranslation();
	const { resources, getResources } = useResourceStore();
	const { orgId } = useParams() as Record<string, string>;
	function getIcon(type: string): React.ReactNode {
		const Icon = RESOURCE_ICON_MAP[type];
		return <Icon className='w-6 h-6' />;
	}

	useEffect(() => {
		getResources({
			orgId,
			type,
		});
	}, []);

	return (
		<Select {...props}>
			<FormControl>
				<SelectTrigger error={error} className={cn('w-full', className)}>
					<SelectValue placeholder={`${t('general.select')} ${t('queue.create.resource.title')}`} />
				</SelectTrigger>
			</FormControl>
			<SelectContent align='center'>
				{/* <Button
					size='full'
					onClick={handleCreateResource}
					variant='blank'
					className='gap-2 px-3 !no-underline text-button-primary font-normal text-left justify-start hover:bg-subtle'
				>
					<Plus weight='bold' size={16} />
					{t('resources.add')}
				</Button>
				{resources.length > 0 && <SelectSeparator />} */}
				{resources.map((resource) => (
					<SelectItem key={resource._id} value={resource._id}>
						<div className='flex items-center gap-2'>
							{getIcon(resource.instance)}
							{resource.name}
						</div>
					</SelectItem>
				))}
				{!resources.length && (
					<SelectItem value='empty' disabled>
						{t('resources.database.no_resource')}
					</SelectItem>
				)}
			</SelectContent>
		</Select>
	);
}
