import useSettingsStore from '@/store/version/settingsStore';
import useVersionStore from '@/store/version/versionStore.ts';
import { SearchNPMPackages } from '@/types';
import { Button } from '@/components/Button';
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from 'components/Drawer';
import { SearchInput } from 'components/SearchInput';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'components/Table';
import { TableLoading } from 'components/Table/Table.tsx';
import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useSearchParams } from 'react-router-dom';
interface AddNPMPackagesDrawerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const SIZE = 15;

export default function AddNPMPackagesDrawer({ open, onOpenChange }: AddNPMPackagesDrawerProps) {
	const { t } = useTranslation();
	const [page, setPage] = useState(0);
	const { searchNPMPackages, addNPMPackage } = useSettingsStore();
	const { version } = useVersionStore();
	const npmPackages = useVersionStore((state) => state.version?.npmPackages ?? []);
	const [packages, setPackages] = useState<SearchNPMPackages[] | null>(null);
	const scrollContainerId = useId();
	const [lastDataLength, setLastDataLength] = useState(0);
	const [loading, setLoading] = useState(false);
	const [searchParams] = useSearchParams();
	useEffect(() => {
		if (!open) {
			setPackages(null);
			setPage(0);
		}
	}, [open]);

	async function onSearch(value: string, init?: boolean, append?: boolean) {
		setLoading(true);
		if (!version) return;

		if (value.length === 0) {
			setPackages(null);
			return;
		}

		const { orgId, appId, _id } = version;

		const packages = await searchNPMPackages({
			orgId,
			appId,
			versionId: _id,
			package: value,
			page: init ? 0 : page,
			size: SIZE,
		});

		setLastDataLength(packages.length);

		if (append) {
			setPackages((prev) => [...(prev ?? []), ...packages]);
		} else {
			setPackages(packages);
		}
		setLoading(false);
	}

	async function addPackage(data: SearchNPMPackages) {
		if (!version) return;
		const { orgId, appId, _id } = version;
		await addNPMPackage({
			orgId,
			appId,
			versionId: _id,
			name: data.package,
			version: data.version,
			description: data.description,
		});
	}

	async function next() {
		if (!searchParams.get('q')) return;
		setPage((prev) => prev + 1);
		await onSearch(searchParams.get('q') as string, false, true);
	}

	return (
		<Drawer open={open} onOpenChange={onOpenChange}>
			<DrawerContent className='flex flex-col gap-0 overflow-auto' position='right'>
				<DrawerHeader>
					<DrawerTitle>{t('version.npm.install')}</DrawerTitle>
				</DrawerHeader>
				<div
					id={scrollContainerId}
					className='p-6 flex-1 flex flex-col gap-4 overflow-auto h-[calc(100vh-97px)]'
				>
					<SearchInput
						onClear={() => setPackages(null)}
						onSearch={(value) => onSearch(value, true)}
						placeholder={t('forms.placeholder', {
							label: t('version.npm.name'),
						}).toString()}
						canAddParam={false}
					/>
					{packages && (
						<InfiniteScroll
							scrollableTarget={scrollContainerId}
							next={next}
							hasMore={lastDataLength >= SIZE}
							loader={loading && <TableLoading />}
							dataLength={packages.length}
						>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{t('general.name')}</TableHead>
										<TableHead>{t('general.version')}</TableHead>
										<TableHead />
									</TableRow>
								</TableHeader>
								<TableBody>
									{packages.length === 0 ? (
										<TableRow className='font-sfCompact font-normal'>
											<TableCell className='text-center' colSpan={3}>
												{t('version.npm.no_packages')}
											</TableCell>
										</TableRow>
									) : (
										packages.map((item, index) => {
											const exist = npmPackages.some((_package) => _package.name === item.package);
											return (
												<TableRow key={index} className='font-sfCompact font-normal group'>
													<TableCell className='max-w-[15ch] whitespace-normal'>
														{item.package}
													</TableCell>
													<TableCell className='w-fit'>{item.version}</TableCell>
													<TableCell className='w-[140px] '>
														<div className='flex items-center justify-center w-full invisible group-hover:visible hover:visible'>
															<Button
																disabled={exist}
																onClick={() => addPackage(item)}
																variant='secondary'
																size='full'
																className='hover:bg-subtle aspect-square'
															>
																{exist ? t('version.npm.already_installed') : t('version.npm.add')}
															</Button>
														</div>
													</TableCell>
												</TableRow>
											);
										})
									)}
								</TableBody>
							</Table>
						</InfiniteScroll>
					)}
					<div className='flex gap-4 justify-end'>
						<DrawerClose asChild>
							<Button variant='secondary' size='lg'>
								{t('general.cancel')}
							</Button>
						</DrawerClose>
						<Button onClick={() => onOpenChange(false)} size='lg'>
							{t('general.close')}
						</Button>
					</div>
				</div>
			</DrawerContent>
		</Drawer>
	);
}
