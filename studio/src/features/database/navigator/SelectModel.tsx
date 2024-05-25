import { Button } from '@/components/Button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuItemContainer,
	DropdownMenuTrigger,
} from '@/components/Dropdown';
import { MODULE_PAGE_SIZE } from '@/constants';
import useModelStore from '@/store/database/modelStore';
import useNavigatorStore from '@/store/database/navigatorStore';
import useTabStore from '@/store/version/tabStore';
import useVersionStore from '@/store/version/versionStore';
import { Model } from '@/types';
import { cn } from '@/utils';
import { CaretDown } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
export default function SelectModel() {
	const { versionId, modelId } = useParams() as { versionId: string; modelId: string };
	const [searchParams, setSearchParams] = useSearchParams();
	const { t } = useTranslation();
	const { dbId } = useParams() as { dbId: string };
	const navigate = useNavigate();
	const { updateCurrentTab } = useTabStore();
	const { setModel, getModelsOfSelectedDb, resetNestedModels, model } = useModelStore();
	const { getVersionDashboardPath } = useVersionStore();
	const models = getModelsOfSelectedDb(dbId);
	const { dataCountInfo } = useNavigatorStore();

	function onModelSelect(model: Model) {
		resetNestedModels();
		searchParams.delete('f');
		searchParams.delete('d');
		searchParams.delete('ref');
		searchParams.delete('page');
		searchParams.delete('limit');
		setSearchParams(searchParams);
		setModel(model);
		const count = dataCountInfo?.[model._id];
		const path = getVersionDashboardPath(
			`database/${dbId}/navigator/${model._id}?page=1&limit=${count?.pageSize ?? MODULE_PAGE_SIZE}`,
		);
		updateCurrentTab(versionId, {
			path,
			title: `${t('database.navigator.title')} - ${model.name} `,
		});
		navigate(path);
	}
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button className='gap-2 whitespace-nowrap'>
					{model.name}
					<CaretDown size={14} />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end' className='max-h-[250px] overflow-y-auto'>
				<DropdownMenuItemContainer>
					{models?.map((model) => (
						<DropdownMenuItem
							key={model._id}
							onClick={() => onModelSelect(model)}
							className={cn('flex items-center gap-2', {
								'font-semibold': model._id === modelId,
							})}
						>
							{model.name}
						</DropdownMenuItem>
					))}
				</DropdownMenuItemContainer>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
