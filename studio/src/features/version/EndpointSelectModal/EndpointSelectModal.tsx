import { Button } from '@/components/Button';
import { MethodBadge } from '@/components/Endpoint';
import { ALL_HTTP_METHODS, ENDPOINT_OPTIONS, MODULE_PAGE_SIZE } from '@/constants';
import useEndpointStore from '@/store/endpoint/endpointStore.ts';
import useVersionStore from '@/store/version/versionStore.ts';
import { Endpoint, HttpMethod, SortOption, TabTypes } from '@/types';
import { cn } from '@/utils';
import { Check, Funnel, FunnelSimple } from '@phosphor-icons/react';
import { CheckedState } from '@radix-ui/react-checkbox';
import { useQuery } from '@tanstack/react-query';
import { Checkbox } from 'components/Checkbox';
import { Drawer, DrawerClose, DrawerContent, DrawerFooter } from 'components/Drawer';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from 'components/Dropdown';
import { EmptyState } from 'components/EmptyState';
import { SearchInput } from 'components/SearchInput';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface EndpointSelectModalProps {
	open: boolean;
	onOpenChange?: (open: boolean) => void;
	defaultSelected?: string[];
	onSelect?: (selected: string[], lastSelected?: Endpoint) => void;
}

export default function EndpointSelectModal({
	open,
	onOpenChange,
	onSelect,
	defaultSelected,
}: EndpointSelectModalProps) {
	const { getEndpoints } = useEndpointStore();
	const [selected, setSelected] = useState<string[]>(defaultSelected ?? []);
	const [methods, setMethods] = useState<HttpMethod[]>([]);
	const [sortOption, setSortOption] = useState<SortOption>(ENDPOINT_OPTIONS[0]);
	const { version } = useVersionStore();
	const endpoints = useEndpointStore((state) => state.endpoints);
	const [search, setSearch] = useState('');
	const { t } = useTranslation();

	const filtered = useMemo(() => {
		if (methods.length === 0) return endpoints;
		return endpoints.filter((e) => methods.includes(e.method));
	}, [methods, endpoints]);

	const { isPending } = useQuery({
		queryKey: ['endpoints', search, sortOption.sortDir, sortOption.value, methods, version._id],
		queryFn: () =>
			getEndpoints({
				orgId: version.orgId,
				appId: version.appId,
				versionId: version._id,
				page: 0,
				search,
				sortDir: sortOption.sortDir,
				sortBy: sortOption.value,
				size: MODULE_PAGE_SIZE,
			}),
		enabled: open,
	});

	function addList(endpoint: Endpoint, checked: CheckedState) {
		setSelected((prev) => {
			const all = checked ? [...prev, endpoint.iid] : prev.filter((id) => id !== endpoint.iid);
			if (onSelect) onSelect(all, checked ? endpoint : undefined);
			return all;
		});
	}

	function onSearch(value: string) {
		setSearch(value);
	}

	function onMethodSelect(method: HttpMethod) {
		setMethods((prev) => {
			return prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method];
		});
	}

	function onSortChanged(sort: SortOption) {
		setSortOption(sort);
	}

	return (
		<Drawer modal open={open} onOpenChange={onOpenChange}>
			<DrawerContent position='center'>
				<div className='font-sfCompact p-2 flex gap-2 items-center border-b'>
					<SearchInput
						onClear={() => onSearch('')}
						onSearch={onSearch}
						className='flex-1 [&_input]:border-none [&_input]:bg-transparent'
					/>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant='outline'>
								<Funnel className='mr-2 text-default' size={14} weight='fill' />
								<span>{t('general.filter')}</span>
								{methods.length > 0 && <span className='ml-1'>({methods.length})</span>}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='start' className='w-40'>
							{ALL_HTTP_METHODS.map((method, index) => (
								<DropdownMenuItem onClick={() => onMethodSelect(method)} key={index} className=''>
									<MethodBadge method={method} />
									{methods.includes(method) && <Check className='ml-[70px]' />}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant='outline' className='gap-2 text-default'>
								<FunnelSimple className='text-default' weight='bold' size={16} />
								{sortOption.name}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end' className='w-28'>
							{ENDPOINT_OPTIONS.map((sort) => (
								<DropdownMenuItem
									key={sort.name}
									className='flex items-center justify-between'
									onClick={() => onSortChanged(sort)}
								>
									{sort.name}
									{sortOption.name === sort.name && <Check />}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				<div className='space-y-2 pt-2'>
					<div
						id='endpoint-list-container'
						className={cn(
							'h-[245px] overflow-auto',
							filtered.length === 0 && 'flex items-center justify-center',
						)}
					>
						{!isPending && filtered.length === 0 ? (
							<EmptyState title='No endpoints found' type={TabTypes.Endpoint} />
						) : (
							filtered.map((endpoint, index) => {
								const checked = selected.includes(endpoint.iid);
								const id = `endpoint-${endpoint._id}`;
								return (
									<div
										className={cn(
											'peer-checked:bg-wrapper-background-light px-4 h-[40px] grid items-center  grid-cols-[24px_1fr] gap-2',
											checked && 'bg-wrapper-background-light',
										)}
										key={index}
									>
										<Checkbox
											id={id}
											checked={checked}
											onCheckedChange={(checked) => addList(endpoint, checked)}
										/>
										<label htmlFor={id}>
											<MethodBadge method={endpoint.method} className='w-14' />
											<span className='text-xs ml-2 text-default'>{endpoint.name}</span>
										</label>
									</div>
								);
							})
						)}
					</div>
				</div>

				<DrawerFooter className='p-4'>
					<DrawerClose asChild>
						<Button size='lg'>{t('general.close')}</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
