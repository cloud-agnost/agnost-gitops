import { InfoModal } from '@/components/InfoModal';
import { SelectionDropdown } from '@/components/SelectionDropdown';
import { OrganizationCreateModal } from '@/features/organization';
import { useToast } from '@/hooks';
import useAuthStore from '@/store/auth/authStore';
import useOrganizationStore from '@/store/organization/organizationStore';
import useProjectStore from '@/store/project/projectStore';
import { APIError, Organization } from '@/types';
import { Envelope, GearSix, Plus, SignOut } from '@phosphor-icons/react';
import { DropdownMenuItem } from '@/components/Dropdown';
import { useMutation } from '@tanstack/react-query';
import _, { isEmpty } from 'lodash';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './organization.scss';
import OrganizationSettings from './OrganizationSettings';
import InviteOrganization from './Settings/Members/InviteOrganization';
import useEnvironmentStore from '@/store/environment/environmentStore';
export function OrganizationDropdown() {
	const { t } = useTranslation();
	const { user } = useAuthStore();
	const [openModal, setOpenModal] = useState(false);
	const [openCreateModal, setOpenCreateModal] = useState(false);
	const [openInviteDialog, setOpenInviteDialog] = useState(false);
	const {
		organizations,
		organization,
		selectOrganization,
		leaveOrganization,
		getAllOrganizationByUser,
		toggleOrganizationSettings,
	} = useOrganizationStore();
	const { getProjects } = useProjectStore();
	const navigate = useNavigate();
	const [_, setSearchParams] = useSearchParams();
	const { toast } = useToast();

	const { mutate: leaveOrgMutate, isPending } = useMutation({
		mutationFn: leaveOrganization,
		onSuccess: () => {
			toast({
				title:
					t('organization.leave.success.title', {
						name: organization?.name,
					}) ?? '',
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
		getProjects(org._id);
		navigate(`/organization/${org?._id}/projects`);
		selectOrganization(org);
	}

	function navigateOrg() {
		useProjectStore.getState().reset();
		useEnvironmentStore.getState().reset();
		navigate(`/organization/${organization?._id}/projects`);
	}

	function openOrgSettings() {
		setSearchParams({ ot: 'general' });
		toggleOrganizationSettings();
	}

	useEffect(() => {
		if (isEmpty(organizations)) {
			getAllOrganizationByUser();
		}
	}, []);
	return (
		<>
			<OrganizationSettings />
			<InviteOrganization dropdown open={openInviteDialog} onOpenChange={setOpenInviteDialog} />
			<SelectionDropdown<Organization>
				data={organizations}
				selectedData={organization}
				onSelect={(org) => onSelect(org as Organization)}
				onClick={navigateOrg}
			>
				<DropdownMenuItem onClick={openOrgSettings}>
					<GearSix size={16} className='mr-2' />
					{t('general.settings')}
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setOpenInviteDialog(true)}>
					<Envelope size={16} className='mr-2' />
					{t('general.addMembers')}
				</DropdownMenuItem>

				<DropdownMenuItem
					onClick={() => setOpenModal(true)}
					disabled={organization?.ownerUserId === user?._id}
				>
					<SignOut size={16} className='mr-2' />
					{t('organization.leave.main')}
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setOpenCreateModal(true)} disabled={!user?.isClusterOwner}>
					<Plus size={16} className='mr-2' />
					{t('organization.create')}
				</DropdownMenuItem>
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
