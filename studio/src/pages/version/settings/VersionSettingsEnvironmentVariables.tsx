import { DataTable } from '@/components/DataTable';
import { EditEnvVariable, VariableColumns } from '@/features/version/SettingsEnvironmentVariables';
import CreateEnvVariable from '@/features/version/SettingsEnvironmentVariables/CreateEnvVariable';
import { useAuthorizeVersion, useSearch, useTable } from '@/hooks';
import { VersionTabLayout } from '@/layouts/VersionLayout';
import useSettingsStore from '@/store/version/settingsStore';
import useVersionStore from '@/store/version/versionStore';
import { TabTypes } from '@/types';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function VersionSettingsEnvironmentVariables() {
	const { t } = useTranslation();
	const canCreate = useAuthorizeVersion('version.param.create');
	const variables = useVersionStore((state) => state.version?.params ?? []);
	const version = useVersionStore((state) => state.version);
	const [openCreateModal, setOpenCreateModal] = useState(false);
	const { setEditParamDrawerIsOpen, editParamDrawerIsOpen, deleteMultipleParams } =
		useSettingsStore();

	const { mutateAsync: deleteMutate } = useMutation({
		mutationFn: deleteMultipleParams,
		onSuccess: () => {
			table?.resetRowSelection();
		},
	});
	async function deleteMultipleParamsHandler() {
		if (!version || !table?.getSelectedRowModel().rows?.length) return;
		deleteMutate({
			versionId: version._id,
			orgId: version.orgId,
			appId: version.appId,
			paramIds: table?.getSelectedRowModel().rows?.map((row) => row.original._id),
		});
	}
	const sortedVariables = useSearch(variables);
	const table = useTable({
		data: sortedVariables,
		columns: VariableColumns,
	});

	return (
		<>
			<VersionTabLayout
				type={TabTypes.EnvironmentVariables}
				title={t('version.settings.environment_variables') as string}
				isEmpty={!sortedVariables.length}
				openCreateModal={() => setOpenCreateModal(true)}
				onMultipleDelete={deleteMultipleParamsHandler}
				selectedRowCount={table.getSelectedRowModel().rows.length}
				onClearSelected={() => table.toggleAllRowsSelected(false)}
				disabled={!canCreate}
				loading={false}
			>
				<DataTable table={table} className='table-fixed' />
			</VersionTabLayout>
			<CreateEnvVariable open={openCreateModal} onOpenChange={setOpenCreateModal} />
			<EditEnvVariable open={editParamDrawerIsOpen} onOpenChange={setEditParamDrawerIsOpen} />
		</>
	);
}
