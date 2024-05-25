import { Button } from '@/components/Button';
import { CommandItem } from '@/components/Command';
import { InfoModal } from '@/components/InfoModal';
import { SelectionDropdown } from '@/components/SelectionDropdown';
import { OrganizationCreateModal } from '@/features/organization';
import { useToast } from '@/hooks';
import useApplicationStore from '@/store/app/applicationStore';
import useAuthStore from '@/store/auth/authStore';
import useOrganizationStore from '@/store/organization/organizationStore';
import { APIError, Organization } from '@/types';
import { Plus } from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './organization.scss';
import { resetAfterVersionChange } from '@/utils';
export function OrganizationDropdown() {
	const { t } = useTranslation();
	const { user } = useAuthStore();
	const [openModal, setOpenModal] = useState(false);
	const [openCreateModal, setOpenCreateModal] = useState(false);
	const {
		organizations,
		organization,
		selectOrganization,
		leaveOrganization,
		getAllOrganizationByUser,
	} = useOrganizationStore();
	const navigate = useNavigate();
	const { getAppsByOrgId } = useApplicationStore();
	const { toast } = useToast();

	const { mutate: leaveOrgMutate, isPending } = useMutation({
		mutationFn: leaveOrganization,
		onSuccess: () => {
			toast({
				title: t('organization.leave.success.title', {
					name: organization?.name,
				}) as string,
				action: 'success',
			});
			setOpenModal(false);
			navigate('/organization');
		},
		onError: ({ details }: APIError) => {
			toast({
				title: details,
				action: 'error',
			});
		},
	});
	function handleLeave() {
		leaveOrgMutate({
			organizationId: organization?._id,
		});
	}

	function onSelect(org: Organization) {
		getAppsByOrgId(org._id);
		navigate(`/organization/${org?._id}`);
		selectOrganization(org);
	}

	function navigateOrg() {
		resetAfterVersionChange();
		navigate(`/organization/${organization?._id}`);
	}

	useEffect(() => {
		if (_.isEmpty(organizations)) {
			getAllOrganizationByUser();
		}
	}, []);

	return (
		<>
			<SelectionDropdown<Organization>
				data={organizations}
				selectedData={organization}
				onSelect={(org) => onSelect(org as Organization)}
				onClick={navigateOrg}
			>
				<CommandItem
					className='flex !justify-center'
					disabled={organization?.ownerUserId === user?._id}
				>
					<Button
						disabled={organization?.ownerUserId === user?._id}
						className='w-full font-normal'
						variant='text'
						onClick={() => setOpenModal(true)}
					>
						{t('organization.leave.main')}
					</Button>
				</CommandItem>
				<CommandItem className='hover:bg-[unset]' disabled={!user?.isClusterOwner}>
					<Button
						className='font-normal'
						disabled={!user?.isClusterOwner}
						size='full'
						variant='primary'
						onClick={() => setOpenCreateModal(true)}
					>
						<Plus size={16} className='mr-2' />
						{t('organization.create')}
					</Button>
				</CommandItem>
			</SelectionDropdown>

			<InfoModal
				isOpen={openModal}
				closeModal={() => setOpenModal(false)}
				onConfirm={handleLeave}
				title={t('organization.leave.main')}
				description={t('organization.leave.description', {
					name: organization?.name,
				})}
				loading={isPending}
			/>
			<OrganizationCreateModal
				key={openCreateModal.toString()}
				isOpen={openCreateModal}
				closeModal={() => setOpenCreateModal(false)}
			/>
		</>
	);
}
