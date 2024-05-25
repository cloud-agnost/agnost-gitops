import { ConfirmationModal } from '@/components/ConfirmationModal';
import { DataTable } from '@/components/DataTable';
import { EmptyState } from '@/components/EmptyState';
import { SearchInput } from '@/components/SearchInput';
import { AddResourceButton, EditResourceDrawer } from '@/features/resources';
import { useTable } from '@/hooks';
import useResourcesStore from '@/store/resources/resourceStore';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Trans, useTranslation } from 'react-i18next';
import { useParams, useSearchParams } from 'react-router-dom';

import { Loading } from '@/components/Loading';
import { ResourceTableColumn } from './ResourceTable/ResourceTableColumn';
import { useEffect } from 'react';
export default function OrgResources() {
	const { t } = useTranslation();
	const [searchParams] = useSearchParams();
	const { orgId } = useParams() as Record<string, string>;
	const {
		resources,
		isDeletedResourceModalOpen,
		deletedResource,
		deleteResource,
		getOrgResources,
		closeDeleteResourceModal,
	} = useResourcesStore();

	const table = useTable({
		data: resources,
		columns: ResourceTableColumn,
	});

	const { isPending, refetch } = useQuery({
		queryKey: [
			'orgResources',
			orgId,
			searchParams.get('q'),
			searchParams.get('f'),
			searchParams.get('d'),
		],
		queryFn: () =>
			getOrgResources({
				search: searchParams.get('q') as string,
				orgId,
				sortBy: searchParams.get('f') ?? 'name',
				sortDir: searchParams.get('d') ?? 'asc',
			}),
		refetchOnWindowFocus: false,
	});

	const {
		mutateAsync: deleteMutate,
		isPending: deleteLoading,
		error,
		reset,
	} = useMutation({
		mutationFn: deleteResource,
		mutationKey: ['deleteResource'],
	});

	useEffect(() => {
		refetch();
	}, [searchParams.get('q')]);

	return (
		<div className='p-8 scroll' id='resource-scroll'>
			<Loading loading={isPending} />
			{!isPending && (
				<>
					<div className='flex items-center justify-between mb-4'>
						<h1 className='text-default text-lg font-semibold text-center'>
							{t('resources.title')}
						</h1>
						<div className='flex items-center justify-center gap-6'>
							<SearchInput
								value={searchParams.get('q') ?? undefined}
								className='sm:w-[450px] flex-1'
							/>
							<AddResourceButton />
						</div>
					</div>
					{resources.length ? (
						<DataTable table={table} />
					) : (
						<EmptyState title={t('resources.empty')} type='resource' />
					)}
				</>
			)}
			<ConfirmationModal
				title={t('resources.delete.title')}
				alertTitle={t('resources.delete.message')}
				alertDescription={t('resources.delete.description')}
				description={
					<Trans
						i18nKey='profileSettings.delete_confirm_description'
						values={{ confirmCode: deletedResource?.iid as string }}
						components={{
							confirmCode: <span className='font-bold text-default' />,
						}}
					/>
				}
				confirmCode={deletedResource?.iid as string}
				onConfirm={() =>
					deleteMutate({
						resourceId: deletedResource?._id as string,
						orgId,
					})
				}
				isOpen={isDeletedResourceModalOpen}
				closeModal={() => {
					reset();
					closeDeleteResourceModal();
				}}
				loading={deleteLoading}
				error={error}
				closable
			/>

			<EditResourceDrawer />
		</div>
	);
}
