import { Button } from '@/components/Button';
import { DataTable } from '@/components/DataTable';
import { Loading } from '@/components/Loading';
import { SearchInput } from '@/components/SearchInput';
import { useTable } from '@/hooks';
import useAuthorizeApp from '@/hooks/useAuthorizeApp';
import { toast } from '@/hooks/useToast';
import useApplicationStore from '@/store/app/applicationStore';
import useClusterStore from '@/store/cluster/clusterStore';
import { Application, ApplicationMember } from '@/types';
import { useMutation } from '@tanstack/react-query';
import { RoleDropdown } from 'components/RoleDropdown';
import { SelectedRowButton } from 'components/Table';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useSearchParams } from 'react-router-dom';
import { AppMembersTableColumns } from './AppMembersTableColumns';
export default function MainAppMembers({ loading }: { loading: boolean }) {
	const [searchParams] = useSearchParams();
	const { applicationTeam, application, openInviteMemberDrawer, removeMultipleAppMembers } =
		useApplicationStore();
	const filteredMembers = useMemo(() => {
		if (searchParams.get('m')) {
			const query = new RegExp(searchParams.get('m') as string, 'i');
			return applicationTeam.filter((val) => RegExp(query).exec(val.member.name));
		}
		return applicationTeam;
	}, [searchParams.get('m'), applicationTeam]);

	const table = useTable({
		data: filteredMembers,
		columns: AppMembersTableColumns,
	});
	const { canClusterSendEmail } = useClusterStore();
	const canMultiDelete = useAuthorizeApp('team.delete');
	const { t } = useTranslation();
	const { orgId } = useParams() as Record<string, string>;
	const { mutate: removeMultipleMembersMutate } = useMutation({
		mutationFn: removeMultipleAppMembers,
		onSuccess: () => {
			toast({
				title: t('general.member.delete') as string,
				action: 'success',
			});
			table?.toggleAllRowsSelected(false);
		},
		onError: ({ details }) => {
			toast({
				title: details,
				action: 'error',
			});
		},
	});
	function removeMultipleMembers() {
		const userIds = table.getSelectedRowModel().rows?.map((row) => row.original.member._id);
		removeMultipleMembersMutate({
			userIds,
			orgId,
			appId: application?._id as string,
		});
	}
	return (
		<div className='space-y-6 p-6 relative'>
			<div className='flex items-center gap-4'>
				<SearchInput
					className='flex-1'
					placeholder={t('general.search') as string}
					urlKey='m'
					value={searchParams.get('m') as string}
				/>
				<div className='flex items-center gap-4'>
					{!!table.getSelectedRowModel().rows?.length && (
						<SelectedRowButton
							onDelete={removeMultipleMembers}
							count={table.getSelectedRowModel().rows.length}
							onReset={() => table.toggleAllRowsSelected(false)}
							disabled={!canMultiDelete}
						/>
					)}
					<RoleDropdown
						type={'app'}
						onChange={(roles) => table?.getColumn('role')?.setFilterValue(roles)}
					/>
					{canClusterSendEmail && (
						<Button
							variant='primary'
							onClick={() => openInviteMemberDrawer(application as Application)}
						>
							{t('application.edit.invite')}
						</Button>
					)}
				</div>
			</div>
			{loading ? <Loading loading={loading} /> : <DataTable<ApplicationMember> table={table} />}
		</div>
	);
}
