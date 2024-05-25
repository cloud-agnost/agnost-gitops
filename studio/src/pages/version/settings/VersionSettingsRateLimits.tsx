import { DataTable } from '@/components/DataTable';
import { CreateRateLimit, EditRateLimit } from '@/features/version/SettingsGeneral';
import { RateLimitsColumns } from '@/features/version/SettingsRateLimits';
import { useAuthorizeVersion, useSearch, useTable } from '@/hooks';
import { VersionTabLayout } from '@/layouts/VersionLayout';
import useSettingsStore from '@/store/version/settingsStore';
import useVersionStore from '@/store/version/versionStore';
import { RateLimit, TabTypes } from '@/types';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function VersionSettingsRateLimits() {
	const { t } = useTranslation();
	const canCreate = useAuthorizeVersion('version.limit.create');
	const limits = useVersionStore((state) => state.version?.limits ?? []);
	const { version } = useVersionStore();
	const [openCreateModal, setOpenCreateModal] = useState(false);
	const { editRateLimitDrawerIsOpen, setEditRateLimitDrawerIsOpen, deleteMultipleRateLimits } =
		useSettingsStore();
	const sortedLimits = useSearch(limits);

	const table = useTable({
		data: sortedLimits,
		columns: RateLimitsColumns,
	});

	const { mutateAsync: deleteMutate } = useMutation({
		mutationFn: deleteMultipleRateLimits,
		onSuccess: () => {
			table?.resetRowSelection();
		},
	});
	async function deleteHandler() {
		if (!version) return;
		deleteMutate({
			orgId: version.orgId,
			versionId: version._id,
			appId: version.appId,
			limitIds: table?.getSortedRowModel().rows.map((row) => row.original._id) as string[],
		});
	}

	return (
		<>
			<VersionTabLayout
				type={TabTypes.RateLimits}
				title={t('version.settings.rate_limits') as string}
				isEmpty={!sortedLimits.length}
				openCreateModal={() => setOpenCreateModal(true)}
				onMultipleDelete={deleteHandler}
				selectedRowCount={table.getSelectedRowModel().rows.length}
				onClearSelected={() => table.toggleAllRowsSelected(false)}
				disabled={!canCreate}
				loading={false}
			>
				<DataTable<RateLimit> table={table} className='table-fixed' />
			</VersionTabLayout>
			<EditRateLimit open={editRateLimitDrawerIsOpen} onOpenChange={setEditRateLimitDrawerIsOpen} />
			<CreateRateLimit open={openCreateModal} onOpenChange={setOpenCreateModal} />
		</>
	);
}
