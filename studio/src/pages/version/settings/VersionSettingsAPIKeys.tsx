import { DataTable } from '@/components/DataTable';
import { AddOrEditAPIKeyDrawer, SettingsAPIKeysColumns } from '@/features/version/SettingsAPIKeys';
import { useAuthorizeVersion, useSearch, useTable } from '@/hooks';
import { VersionTabLayout } from '@/layouts/VersionLayout';
import useSettingsStore from '@/store/version/settingsStore';
import useVersionStore from '@/store/version/versionStore';
import { TabTypes } from '@/types';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function VersionSettingsAPIKeys() {
	const { t } = useTranslation();
	const canCreate = useAuthorizeVersion('version.key.create');
	const apiKeys = useVersionStore((state) => state.version?.apiKeys ?? []);
	const version = useVersionStore((state) => state.version);
	const [openCreateModal, setOpenCreateModal] = useState(false);
	const { editAPIKeyDrawerIsOpen, setEditAPIKeyDrawerIsOpen, deleteMultipleAPIKeys } =
		useSettingsStore();
	const sortedApiKeys = useSearch(apiKeys);

	const table = useTable({
		data: sortedApiKeys,
		columns: SettingsAPIKeysColumns,
	});

	const { mutateAsync: deleteMutate } = useMutation({
		mutationFn: deleteMultipleAPIKeys,
		onSuccess: () => {
			table?.resetRowSelection();
		},
	});
	async function deleteMultipleApiKeys() {
		if (!version || table?.getSelectedRowModel().rows?.length === 0) return;

		deleteMutate({
			appId: version.appId,
			keyIds: table?.getSelectedRowModel().rows.map((row) => row.original._id),
			versionId: version._id,
			orgId: version.orgId,
		});

		table?.resetRowSelection();
	}

	function closeModal() {
		setOpenCreateModal(false);
		setEditAPIKeyDrawerIsOpen(false);
	}

	return (
		<>
			<VersionTabLayout
				type={TabTypes.APIKeys}
				title={t('version.settings.api_keys') as string}
				isEmpty={!sortedApiKeys.length}
				openCreateModal={() => setOpenCreateModal(true)}
				onMultipleDelete={deleteMultipleApiKeys}
				selectedRowCount={table.getSelectedRowModel().rows.length}
				onClearSelected={() => table.toggleAllRowsSelected(false)}
				disabled={!canCreate}
				loading={false}
			>
				<DataTable table={table} className='table-fixed' />
			</VersionTabLayout>
			<AddOrEditAPIKeyDrawer
				key={editAPIKeyDrawerIsOpen.toString()}
				open={editAPIKeyDrawerIsOpen || openCreateModal}
				onOpenChange={closeModal}
				editMode={editAPIKeyDrawerIsOpen}
			/>
		</>
	);
}
