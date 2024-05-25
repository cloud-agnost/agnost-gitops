import { CommandEmpty, CommandInput, CommandList, CommandLoading } from '@/components/Command';
import { MethodBadge } from '@/components/Endpoint';
import { Loading } from '@/components/Loading';
import { useDebounce, useTabIcon, useUpdateEffect } from '@/hooks';
import useTabStore from '@/store/version/tabStore';
import useVersionStore from '@/store/version/versionStore';
import { DesignElement, Tab, TabTypes } from '@/types';
import { generateId } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { useState } from 'react';
import { Button } from '@/components/Button';
import { useParams } from 'react-router-dom';
import { X } from '@phosphor-icons/react';
export default function SearchEntities() {
	const [search, setSearch] = useState('');
	const searchTerm = useDebounce(search, 500);
	const { addTab } = useTabStore();
	const { appId, orgId, versionId } = useParams() as Record<string, string>;
	const { searchDesignElements, isSearchCommandMenuOpen, getVersionDashboardPath } =
		useVersionStore();

	const getIcon = useTabIcon('w-5 h-5');
	useUpdateEffect(() => {
		if (!isSearchCommandMenuOpen) {
			setSearch('');
		}
	}, [isSearchCommandMenuOpen]);

	const { data, isFetching } = useQuery({
		queryKey: ['version', versionId, orgId, appId, searchTerm],
		queryFn: () =>
			searchDesignElements({
				orgId,
				appId,
				versionId,
				keyword: searchTerm,
			}),
		enabled: !!searchTerm,
	});

	function handleClickElement(item: DesignElement) {
		let url = `${item.type}/${item._id}`;
		if (_.capitalize(item.type) === TabTypes.Database) url = `database/${item._id}/models`;

		if (_.capitalize(item.type) === TabTypes.Model)
			url = `database/${item.meta.dbId}/models/${item._id}/fields`;

		const path = getVersionDashboardPath(url);

		const tab: Tab = {
			id: generateId(),
			title:
				_.capitalize(item.type) === TabTypes.Field ? (item.meta.modelName as string) : item.name,
			path,
			isActive: true,
			isDashboard: false,
			isDirty: false,
			type: _.capitalize(item.type) as TabTypes,
		};
		addTab(versionId, tab);
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
	}
	return (
		<div>
			<div className='relative'>
				<CommandInput value={search} onValueChange={setSearch} placeholder='Search app entities' />
				{search && (
					<Button
						className='absolute right-4 top-1/2 transform -translate-y-1/2'
						onClick={() => setSearch('')}
						variant='icon'
						size='sm'
						rounded
					>
						<X size={16} />
					</Button>
				)}
			</div>

			<CommandList className='relative'>
				{isFetching ? (
					<CommandLoading>
						<Loading loading={isFetching} />
					</CommandLoading>
				) : (
					data?.map((item) => (
						<Button
							key={item._id}
							variant='blank'
							className='justify-between py-6 px-4 hover:bg-lighter dark:hover:bg-wrapper-background-hover rounded-none'
							size='full'
							onClick={() => handleClickElement(item)}
						>
							<div className='flex items-center gap-4'>
								{getIcon(_.capitalize(item.type) as TabTypes)}
								<p className='text-sm leading-6 tracking-wide font-sfCompact'>{item.name}</p>
							</div>
							<div className='flex items-center gap-4'>
								{item.meta?.method && <MethodBadge method={item.meta?.method} />}
								<p className='text-xs leading-6 text-subtle tracking-wide '>
									{_.capitalize(item.type) === TabTypes.Field && ` ${item.meta.modelName}`}
								</p>
								<p className='text-xs text-subtle leading-6 tracking-wide font-sfCompact'>
									{_.capitalize(item.type)}
								</p>
							</div>
						</Button>
					))
				)}
				{_.isEmpty(data) && searchTerm && <CommandEmpty>No results found.</CommandEmpty>}
			</CommandList>
		</div>
	);
}
