import { Button } from '@/components/Button';
import useAuthorizeOrg from '@/hooks/useAuthorizeOrg';
import { Plus } from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ApplicationCreateModal from './ApplicationCreateModal';

export default function CreateApplicationButton({ size }: { size?: 'sm' | 'lg' | 'xl' | 'full' }) {
	const { t } = useTranslation();
	const canAppCreate = useAuthorizeOrg('app.create');
	const [openAppCreateModal, setOpenAppCreateModal] = useState(false);
	return (
		<>
			<Button
				variant='primary'
				size={size}
				onClick={() => setOpenAppCreateModal(true)}
				disabled={!canAppCreate}
			>
				<Plus size={14} className='mr-1 text-icon-default' />
				{t('application.create')}
			</Button>
			<ApplicationCreateModal
				key={openAppCreateModal.toString()}
				isOpen={openAppCreateModal}
				closeModal={() => setOpenAppCreateModal(false)}
			/>
		</>
	);
}
