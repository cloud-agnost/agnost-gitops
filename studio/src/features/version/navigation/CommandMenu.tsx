import {
	CommandDialog,
	CommandEmpty,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/Command';
import ApplicationCreateModal from '@/features/application/ApplicationCreateModal';
import { OrganizationCreateModal, OrganizationInvitationDrawer } from '@/features/organization';
import { SelectResourceTypeModal } from '@/features/resources';
import useApplicationStore from '@/store/app/applicationStore';
import useResourceStore from '@/store/resources/resourceStore';
import useUtilsStore from '@/store/version/utilsStore';
import useVersionStore from '@/store/version/versionStore';
import { Application, ResourceCreateType } from '@/types';
import { EjectSimple, FileArchive, MagnifyingGlass, Plus, Users } from '@phosphor-icons/react';
import { useState } from 'react';
import SearchEntities from './SearchEntities';

export default function CommandMenu() {
	const [openCreateAppModal, setOpenCreateAppModal] = useState(false);
	const [openCreateOrgModal, setOpenCreateOrgModal] = useState(false);
	const [openEntitySearch, setOpenEntitySearch] = useState(false);
	const [openInviteOrgModal, setOpenInviteOrgModal] = useState(false);
	const { toggleSidebar, isSidebarOpen } = useUtilsStore();
	const { isSearchCommandMenuOpen, toggleSearchCommandMenu, toggleSearchView, isSearchViewOpen } =
		useVersionStore();

	const { openInviteMemberDrawer, application } = useApplicationStore();
	const { openSelectResourceTypeModal } = useResourceStore();
	const items = [
		{
			icon: <MagnifyingGlass />,
			label: 'Search through your source code',
			onClick: openCodeSearch,
			closeMenu: true,
		},
		{
			icon: <FileArchive />,
			label: 'Search app entities',
			onClick: () => setOpenEntitySearch(true),
			closeMenu: false,
		},

		{
			icon: <Users />,
			label: 'Invite users to org',
			onClick: () => setOpenInviteOrgModal(true),
			closeMenu: true,
		},
		{
			icon: <Plus />,
			label: 'Create Organization',
			onClick: () => setOpenCreateOrgModal(true),
			closeMenu: true,
		},
		{
			icon: <Users />,
			label: 'Invite users to app',
			onClick: () => openInviteMemberDrawer(application as Application),
			closeMenu: true,
		},
		{
			icon: <Plus />,
			label: 'Create Application',
			onClick: () => setOpenCreateAppModal(true),
			closeMenu: true,
		},
		{
			icon: <EjectSimple />,
			label: 'Connect Resource',
			onClick: () => openSelectResourceTypeModal(ResourceCreateType.Existing),
			closeMenu: true,
		},
		{
			icon: <Plus />,
			label: 'Create Resource',
			onClick: () => openSelectResourceTypeModal(ResourceCreateType.New),
			closeMenu: true,
		},
	];

	function onClose() {
		setOpenEntitySearch(false);
		toggleSearchCommandMenu();
	}

	function openCodeSearch() {
		if (!isSidebarOpen) toggleSidebar();
		if (!isSearchViewOpen) toggleSearchView();
	}

	return (
		<>
			<CommandDialog open={isSearchCommandMenuOpen} onOpenChange={onClose}>
				{openEntitySearch ? (
					<SearchEntities />
				) : (
					<>
						<CommandInput placeholder='Type a command or search...' />
						<CommandList>
							<CommandEmpty>No results found.</CommandEmpty>
							{items.map(({ icon, label, onClick, closeMenu }) => {
								return (
									<CommandItem
										key={label}
										value={label}
										onSelect={() => {
											onClick();
											if (closeMenu) onClose();
										}}
									>
										<div className='flex items-center gap-2'>
											{icon}
											{label}
										</div>
									</CommandItem>
								);
							})}
						</CommandList>
					</>
				)}
			</CommandDialog>
			<OrganizationCreateModal
				isOpen={openCreateOrgModal}
				closeModal={() => setOpenCreateOrgModal(false)}
			/>
			<ApplicationCreateModal
				isOpen={openCreateAppModal}
				closeModal={() => setOpenCreateAppModal(false)}
			/>
			<OrganizationInvitationDrawer
				open={openInviteOrgModal}
				onOpenChange={setOpenInviteOrgModal}
			/>
			<SelectResourceTypeModal />
		</>
	);
}
