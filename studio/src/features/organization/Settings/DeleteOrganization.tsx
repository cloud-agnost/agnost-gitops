import { Alert, AlertDescription, AlertTitle } from '@/components/Alert';
import { Button } from '@/components/Button';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import useAuthorizeOrg from '@/hooks/useAuthorizeOrg';
import { toast } from '@/hooks/useToast';
import useOrganizationStore from '@/store/organization/organizationStore';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function DeleteOrganization() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [isOpen, setIsOpen] = useState(false);
	const confirmCode = useOrganizationStore((state) => state.organization?.iid) as string;
	const { deleteOrganization } = useOrganizationStore();
	const canDelete = useAuthorizeOrg('delete');

	const {
		mutate: onConfirm,
		error,
		isPending,
	} = useMutation({
		mutationFn: deleteOrganization,
		onSuccess: () => {
			closeModal();
			navigate('/organization');
		},
		onError: (error) => {
			toast({
				title: error.details,
				action: 'error',
			});
		},
	});

	function closeModal() {
		setIsOpen(false);
	}
	return (
		<>
			{error && (
				<Alert variant='error'>
					<AlertTitle>{error?.error}</AlertTitle>
					<AlertDescription>{error?.details}</AlertDescription>
				</Alert>
			)}
			<Button
				variant='destructive'
				onClick={() => setIsOpen(true)}
				size='lg'
				disabled={!canDelete}
				className='mt-4'
			>
				{t('general.delete')}
			</Button>
			<ConfirmationModal
				loading={isPending}
				error={error}
				title={t('organization.settings.delete.title')}
				alertTitle={t('organization.settings.delete.confirm.title')}
				alertDescription={t('organization.settings.delete.confirm.desc')}
				description={
					<Trans
						i18nKey='organization.settings.delete.confirm.code'
						values={{ confirmCode }}
						components={{
							confirmCode: <span className='font-bold text-default' />,
						}}
					/>
				}
				confirmCode={confirmCode}
				onConfirm={onConfirm}
				isOpen={isOpen}
				closeModal={closeModal}
				closable
			/>
		</>
	);
}
