import EditBucket from '@/features/storage/EditBucket';
import useStorageStore from '@/store/storage/storageStore';
import { Outlet } from 'react-router-dom';
export default function VersionStorage() {
	const { isEditBucketDialogOpen, closeEditBucketDialog } = useStorageStore();

	return (
		<>
			<EditBucket open={isEditBucketDialogOpen} onClose={closeEditBucketDialog} />
			<Outlet />
		</>
	);
}
