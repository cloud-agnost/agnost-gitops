import { ConfirmationModal } from '@/components/ConfirmationModal';
import { CreateCache, EditCache } from '@/features/cache';
import { CreateDatabase, EditDatabase } from '@/features/database';
import { CreateModel, EditModel } from '@/features/database/models';
import { CreateEndpoint, EditEndpointDrawer } from '@/features/endpoints';
import { CreateFunction, EditFunction } from '@/features/function';
import { CreateMessageQueue, EditMessageQueue } from '@/features/queue';
import { CreateStorage, EditStorage } from '@/features/storage';
import { CreateTask, EditTask } from '@/features/task';
import { CreateMiddleware, EditMiddlewareDrawer } from '@/features/version/Middlewares';
import CommandMenu from '@/features/version/navigation/CommandMenu';
import { VersionLayout } from '@/layouts/VersionLayout';
import useApplicationStore from '@/store/app/applicationStore';
import useCacheStore from '@/store/cache/cacheStore';
import useDatabaseStore from '@/store/database/databaseStore';
import useStorageStore from '@/store/storage/storageStore';
import useUtilsStore from '@/store/version/utilsStore';
import useVersionStore from '@/store/version/versionStore.ts';
import { TabTypes } from '@/types';
import { cn, joinChannel } from '@/utils';
import { useMutation } from '@tanstack/react-query';
import _, { capitalize } from 'lodash';
import { Fragment, useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Outlet, useLocation, useParams } from 'react-router-dom';
export default function Version() {
	const { t } = useTranslation();
	const { pathname } = useLocation();
	const { getVersionById, toggleSearchCommandMenu } = useVersionStore();
	const { toggleSidebar } = useUtilsStore();
	const { getAppById, application } = useApplicationStore();
	const paths = pathname.split('/').filter((item) => /^[a-zA-Z-_]+$/.test(item));
	const { deleteCache, closeDeleteCacheModal, toDeleteCache, isDeleteCacheModalOpen } =
		useCacheStore();
	const { isStorageDeleteDialogOpen, toDeleteStorage, deleteStorage, closeDeleteStorageModal } =
		useStorageStore();
	const { closeDeleteDatabaseModal, isDeleteDatabaseDialogOpen, toDeleteDatabase, deleteDatabase } =
		useDatabaseStore();
	const { appId, orgId, versionId } = useParams() as Record<string, string>;

	const {
		mutateAsync: deleteStorageMutation,
		isPending: isStorageDeleting,
		error: storageError,
	} = useMutation({
		mutationFn: () =>
			deleteStorage({
				storageId: toDeleteStorage?._id as string,
				orgId: orgId as string,
				appId: appId as string,
				versionId: versionId as string,
			}),
		onSuccess: () => {
			closeDeleteStorageModal();
		},
	});

	const {
		mutateAsync: deleteDatabaseMutation,
		isPending: isDatabaseDeleting,
		error: databaseError,
	} = useMutation({
		mutationFn: () =>
			deleteDatabase({
				orgId: toDeleteDatabase.orgId,
				appId: toDeleteDatabase.appId,
				dbId: toDeleteDatabase._id,
				versionId: toDeleteDatabase.versionId,
			}),
		onSuccess: () => {
			closeDeleteDatabaseModal();
		},
	});

	const {
		mutateAsync: deleteCacheMutation,
		error: cacheError,
		isPending: isCacheDeleting,
	} = useMutation({
		mutationFn: () =>
			deleteCache({
				cacheId: toDeleteCache?._id,
				orgId: orgId as string,
				appId: appId as string,
				versionId: versionId as string,
			}),
		onSuccess: () => {
			closeDeleteCacheModal();
		},
	});

	useEffect(() => {
		if (_.isEmpty(application)) {
			getAppById(orgId as string, appId as string);
		} else {
			joinChannel(appId as string);
		}
	}, [appId]);

	useEffect(() => {
		getVersionById({
			appId: appId as string,
			orgId: orgId as string,
			versionId: versionId as string,
		});
	}, [versionId]);

	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				toggleSearchCommandMenu();
			}

			if (e.key === 'b' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				toggleSidebar();
			}
		};

		document.addEventListener('keydown', down);
		return () => document.removeEventListener('keydown', down);
	}, []);
	return (
		<Fragment>
			<VersionLayout
				className={cn(
					paths.slice(-1).pop(),
					paths.some((p) => [TabTypes.Settings].includes(capitalize(p) as TabTypes)) &&
						'!overflow-hidden',
				)}
			>
				<Outlet />
				<CommandMenu />
			</VersionLayout>
			<CreateCache />
			<CreateTask />
			<CreateEndpoint />
			<CreateDatabase />
			<CreateFunction />
			<CreateMessageQueue />
			<CreateStorage />
			<CreateMiddleware />
			<EditCache />
			<EditModel />
			<CreateModel />
			<EditTask />
			<EditDatabase />
			<EditEndpointDrawer />
			<EditFunction />
			<EditMessageQueue />
			<EditStorage />
			<EditMiddlewareDrawer />
			<ConfirmationModal
				loading={isStorageDeleting}
				error={storageError}
				title={t('storage.delete.title')}
				alertTitle={t('storage.delete.message')}
				alertDescription={t('storage.delete.description')}
				description={
					<Trans
						i18nKey='storage.delete.confirmCode'
						values={{ confirmCode: toDeleteStorage?.iid }}
						components={{
							confirmCode: <span className='font-bold text-default' />,
						}}
					/>
				}
				confirmCode={toDeleteStorage?.iid as string}
				onConfirm={deleteStorageMutation}
				isOpen={isStorageDeleteDialogOpen}
				closeModal={closeDeleteStorageModal}
				closable
			/>
			<ConfirmationModal
				alertTitle={t('database.delete.confirm_title')}
				alertDescription={t('database.delete.confirm_description')}
				title={t('database.delete.title')}
				confirmCode={toDeleteDatabase.name}
				description={
					<Trans
						i18nKey='database.delete.confirm'
						values={{ confirmCode: toDeleteDatabase.name }}
						components={{
							confirmCode: <span className='font-bold text-default' />,
						}}
					/>
				}
				onConfirm={deleteDatabaseMutation}
				isOpen={isDeleteDatabaseDialogOpen}
				closeModal={closeDeleteDatabaseModal}
				closable
				error={databaseError}
				loading={isDatabaseDeleting}
			/>
			<ConfirmationModal
				loading={isCacheDeleting}
				error={cacheError}
				title={t('cache.delete.title')}
				alertTitle={t('cache.delete.message')}
				alertDescription={t('cache.delete.description')}
				description={
					<Trans
						i18nKey='cache.delete.confirmCode'
						values={{ confirmCode: toDeleteCache?.iid }}
						components={{
							confirmCode: <span className='font-bold text-default' />,
						}}
					/>
				}
				confirmCode={toDeleteCache?.iid}
				onConfirm={deleteCacheMutation}
				isOpen={isDeleteCacheModalOpen}
				closeModal={closeDeleteCacheModal}
				closable
			/>
		</Fragment>
	);
}
