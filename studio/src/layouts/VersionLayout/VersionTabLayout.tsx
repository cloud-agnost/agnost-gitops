import { Button } from '@/components/Button';
import { EmptyState, Modules } from '@/components/EmptyState';
import { Loading } from '@/components/Loading';
import { SearchInput } from '@/components/SearchInput';
import { SelectedRowButton } from '@/components/Table';
import { useUpdateEffect } from '@/hooks';
import useTabStore from '@/store/version/tabStore';
import { TabTypes } from '@/types';
import { cn } from '@/utils';
import { Download, Plus, Upload } from '@phosphor-icons/react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';

interface Props {
	title?: string;
	isEmpty: boolean;
	type: Modules;
	children: ReactNode;
	disabled?: boolean;
	className?: string;
	breadCrumb?: ReactNode;
	handlerButton?: ReactNode;
	loading: boolean;
	searchable?: boolean;
	selectedRowCount?: number;
	onClearSelected?: () => void;
	onMultipleDelete?: () => void;
	openCreateModal?: () => void;
}

export default function VersionTabLayout({
	isEmpty,
	children,
	type,
	breadCrumb,
	disabled,
	className,
	handlerButton,
	loading,
	searchable,
	title,
	selectedRowCount,
	onMultipleDelete,
	openCreateModal,
	onClearSelected,
}: Props) {
	const [searchParams, setSearchParams] = useSearchParams();
	const { versionId } = useParams<{ versionId: string }>();
	const { pathname, search } = useLocation();
	const { t } = useTranslation();
	const { updateCurrentTab } = useTabStore();

	function onClearHandler() {
		searchParams.delete('q');
		setSearchParams(searchParams);
	}

	function buttonContent() {
		switch (type) {
			case TabTypes.NPMPackages:
				return (
					<>
						<Download size={14} />
						{t('version.npm.install')}
					</>
				);
			case TabTypes.File:
				return (
					<>
						<Upload size={14} />
						{t('storage.file.upload')}
					</>
				);
			default:
				return (
					<>
						<Plus size={14} />
						{t('general.module_create', {
							module: type,
						})}
					</>
				);
		}
	}

	let content;

	if (isEmpty) {
		if (searchParams.has('q')) {
			content = (
				<EmptyState type={type} className='flex-1' title={t('general.no_result')}>
					<Button className='btn btn-primary' onClick={onClearHandler}>
						{t('general.reset_search_query')}
					</Button>
				</EmptyState>
			);
		} else {
			content = (
				<EmptyState
					type={type}
					className='flex-1'
					title={t('general.module_empty', {
						module: type.toLowerCase(),
					})}
				>
					{openCreateModal ? (
						<Button
							variant='primary'
							onClick={openCreateModal}
							disabled={disabled}
							className='gap-2'
						>
							{buttonContent()}
						</Button>
					) : (
						handlerButton
					)}
				</EmptyState>
			);
		}
	} else {
		content = children;
	}
	useUpdateEffect(() => {
		updateCurrentTab(versionId as string, {
			path: pathname + search,
		});
	}, [search]);
	return (
		<div className={cn('h-full space-y-4 p-4', className)}>
			<div className={cn(!title ? 'flex items-center justify-between' : 'space-y-4')}>
				{breadCrumb}
				<div className='flex items-center justify-between flex-1'>
					<h1 className='text-default text-sm text-center font-semibold'>{title}</h1>
					<div className='flex items-center justify-center gap-2'>
						{searchable && (
							<SearchInput
								value={searchParams.get('q') ?? undefined}
								className='sm:w-[450px] flex-1'
							/>
						)}
						{selectedRowCount ? (
							<SelectedRowButton
								count={selectedRowCount}
								onReset={onClearSelected as () => void}
								onDelete={() => onMultipleDelete?.()}
								disabled={disabled}
							/>
						) : null}
						{handlerButton}
						{!!openCreateModal && (
							<Button
								variant='primary'
								onClick={openCreateModal}
								disabled={disabled}
								className='gap-2'
							>
								{buttonContent()}
							</Button>
						)}
					</div>
				</div>
			</div>
			<div className='h-[calc(100%-2.5rem)]'>{!loading && content}</div>
			<Loading loading={loading} />
		</div>
	);
}
