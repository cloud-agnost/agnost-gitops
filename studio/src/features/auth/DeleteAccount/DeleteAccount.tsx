import { Button } from '@/components/Button';

import { resetAllStores } from '@/helpers';
import useAuthStore from '@/store/auth/authStore.ts';
import { useMutation } from '@tanstack/react-query';
import { ConfirmationModal } from 'components/ConfirmationModal';
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './deleteAccount.scss';
export default function DeleteAccount() {
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const { user } = useAuthStore();
	const { deleteAccount } = useAuthStore();
	const navigate = useNavigate();
	const {
		mutateAsync: deleteAccountMutate,
		isPending: loading,
		error,
	} = useMutation({
		mutationFn: deleteAccount,
		onSuccess: () => {
			navigate('/login');
			resetAllStores();
		},
	});
	function closeModal() {
		setIsOpen(false);
	}

	function openModal() {
		setIsOpen(true);
	}

	return (
		<>
			<ConfirmationModal
				loading={loading}
				error={error}
				title={t('profileSettings.delete_my_account')}
				alertTitle={t('profileSettings.delete_account_alert_title')}
				alertDescription={t('profileSettings.delete_account_alert_description')}
				description={
					<Trans
						i18nKey='profileSettings.delete_confirm_description'
						values={{ confirmCode: user?.iid }}
						components={{
							confirmCode: <span className='font-bold text-default' />,
						}}
					/>
				}
				confirmCode={user?.iid ?? ''}
				onConfirm={deleteAccountMutate}
				isOpen={isOpen}
				closeModal={closeModal}
				closable
			/>
			<div>
				<Button onClick={openModal} className='delete-account-btn' variant='destructive'>
					{t('profileSettings.delete')}
				</Button>
			</div>
		</>
	);
}
