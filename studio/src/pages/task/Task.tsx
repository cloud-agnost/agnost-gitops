import { Button } from '@/components/Button';
import { DataTable } from '@/components/DataTable';
import { TableLoading } from '@/components/Table/Table';
import { TaskColumns } from '@/features/task';
import { useInfiniteScroll, useTable, useToast } from '@/hooks';
import useAuthorizeVersion from '@/hooks/useAuthorizeVersion';
import { VersionTabLayout } from '@/layouts/VersionLayout';
import useTaskStore from '@/store/task/taskStore';
import useTabStore from '@/store/version/tabStore';
import useVersionStore from '@/store/version/versionStore';
import { APIError, TabTypes, Task } from '@/types';
import { generateId } from '@/utils';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useParams } from 'react-router-dom';

export default function MainTask() {
	const { t } = useTranslation();
	const { toast } = useToast();
	const canEdit = useAuthorizeVersion('task.create');

	const { addTab } = useTabStore();
	const { getVersionDashboardPath } = useVersionStore();
	const { tasks, getTasks, lastFetchedPage, deleteMultipleTasks, toggleCreateModal } =
		useTaskStore();
	const { versionId, orgId, appId } = useParams();

	const { hasNextPage, fetchNextPage, isFetching, isFetchingNextPage } = useInfiniteScroll({
		queryFn: getTasks,
		lastFetchedPage,
		dataLength: tasks.length,
		queryKey: 'getTasks',
	});

	const table = useTable({
		data: tasks,
		columns: TaskColumns,
	});

	const { mutateAsync: deleteMultipleTasksMutation } = useMutation({
		mutationFn: deleteMultipleTasks,
		onSuccess: () => {
			table?.resetRowSelection();
		},
		onError: ({ details }: APIError) => {
			toast({ action: 'error', title: details });
		},
	});

	function deleteMultipleTasksHandler() {
		deleteMultipleTasksMutation({
			taskIds: table.getSelectedRowModel().rows.map((row) => row.original._id),
			orgId: orgId as string,
			appId: appId as string,
			versionId: versionId as string,
		});
	}

	function openLogTab() {
		addTab(versionId as string, {
			id: generateId(),
			title: t('task.logs'),
			path: getVersionDashboardPath('task/logs'),
			isActive: true,
			isDashboard: false,
			type: TabTypes.Task,
		});
	}
	return (
		<>
			<VersionTabLayout
				type={TabTypes.Task}
				title={t('task.title') as string}
				isEmpty={!tasks.length}
				openCreateModal={toggleCreateModal}
				onMultipleDelete={deleteMultipleTasksHandler}
				selectedRowCount={table.getSelectedRowModel().rows.length}
				onClearSelected={() => table.toggleAllRowsSelected(false)}
				disabled={!canEdit}
				loading={isFetching && !tasks.length}
				searchable
				handlerButton={
					<Button variant='secondary' onClick={openLogTab}>
						{t('queue.view_logs')}
					</Button>
				}
			>
				<InfiniteScroll
					scrollableTarget='version-layout'
					dataLength={tasks.length}
					next={fetchNextPage}
					hasMore={hasNextPage}
					loader={isFetchingNextPage && <TableLoading />}
				>
					<DataTable<Task> table={table} />
				</InfiniteScroll>
			</VersionTabLayout>
		</>
	);
}
