import { DataTable } from '@/components/DataTable';
import { AddNPMPackagesDrawer } from '@/features/version/SettingsNPMPackages';
import NPMPackagesColumns from '@/features/version/SettingsNPMPackages/NPMPackagesColumns';
import { useAuthorizeVersion, useSearch, useTable } from '@/hooks';
import { VersionTabLayout } from '@/layouts/VersionLayout';
import useSettingsStore from '@/store/version/settingsStore';
import useVersionStore from '@/store/version/versionStore';
import { NPMPackage, TabTypes } from '@/types';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function VersionSettingsNPMPackages() {
	const { t } = useTranslation();
	const npmPackages = useVersionStore((state) => state.version?.npmPackages ?? []);
	const { version } = useVersionStore();
	const { deleteMultipleNPMPackages } = useSettingsStore();
	const sortedPackages = useSearch(npmPackages);
	const [open, setOpen] = useState(false);
	const canCreate = useAuthorizeVersion('version.package.create');
	const table = useTable({
		data: sortedPackages,
		columns: NPMPackagesColumns,
	});

	const { mutateAsync: deleteMutate } = useMutation({
		mutationFn: deleteMultipleNPMPackages,
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
			packageIds: table.getSelectedRowModel().rows.map((row) => row.original._id) as string[],
		});
	}

	return (
		<>
			<VersionTabLayout
				type={TabTypes.NPMPackages}
				title={t('version.settings.npm_packages') as string}
				isEmpty={!sortedPackages.length}
				openCreateModal={() => setOpen(true)}
				onMultipleDelete={deleteHandler}
				selectedRowCount={table.getSelectedRowModel().rows.length}
				onClearSelected={() => table.toggleAllRowsSelected(false)}
				disabled={!canCreate}
				loading={false}
			>
				<DataTable<NPMPackage> table={table} className='table-fixed' />
			</VersionTabLayout>
			<AddNPMPackagesDrawer open={open} onOpenChange={setOpen} />
		</>
	);
}
