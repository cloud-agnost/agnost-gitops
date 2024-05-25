import { Button } from '@/components/Button';
import { VERSION_SETTINGS_MENU_ITEMS } from '@/constants';
import { useTabIcon, useTabNavigate, useToast, useVersionDropdownItems } from '@/hooks';
import useApplicationStore from '@/store/app/applicationStore.ts';
import useTabStore from '@/store/version/tabStore';
import useVersionStore from '@/store/version/versionStore.ts';
import { APIError, TabTypes } from '@/types';
import { generateId, resetAfterVersionChange } from '@/utils';
import { CaretUpDown, GearSix, LockSimple, LockSimpleOpen, Trash } from '@phosphor-icons/react';
import { ConfirmationModal } from 'components/ConfirmationModal';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuItemContainer,
	DropdownMenuPortal,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from 'components/Dropdown';
import { Fragment, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

export default function VersionDropdown() {
	const { toast } = useToast();
	const { version } = useVersionStore();
	const { t } = useTranslation();
	const [error, setError] = useState<null | APIError>(null);
	const [loading, setLoading] = useState(false);
	const confirmCode = useVersionStore((state) => state.version?.iid) as string;
	const deleteVersionDrawerIsOpen = useVersionStore((state) => state.deleteVersionDrawerIsOpen);
	const { deleteVersion, getVersionDashboardPath } = useVersionStore();
	const { orgId, appId, versionId } = useParams() as Record<string, string>;
	const navigate = useNavigate();
	const tabNavigate = useTabNavigate();
	const { application, openVersionDrawer } = useApplicationStore();
	const { addTab } = useTabStore();
	const versionDropdownItems = useVersionDropdownItems();
	const getIcon = useTabIcon('w-5 h-5');

	function handleAddTab(item: (typeof VERSION_SETTINGS_MENU_ITEMS)[number]) {
		addTab(versionId, {
			title: item.title,
			path: getVersionDashboardPath(`settings/${item.href}`),
			id: generateId(),
			isActive: false,
			isDashboard: false,
			type: item.type,
		});
	}

	function navigateToDashboard() {
		tabNavigate({
			path: getVersionDashboardPath(),
			title: t('version.dashboard'),
			type: TabTypes.Dashboard,
			isDashboard: true,
			isActive: true,
		});
	}

	async function onConfirm() {
		setLoading(true);
		setError(null);
		deleteVersion({
			orgId,
			appId,
			versionId,
			onSuccess: () => {
				resetAfterVersionChange();
				useVersionStore.setState({ deleteVersionDrawerIsOpen: false });
				navigate(`/organization/${orgId}/apps`);
				if (application) openVersionDrawer(application);
				setLoading(false);
			},
			onError: (error) => {
				toast({
					action: 'error',
					title: error.details,
				});
				setError(error as APIError);
				setLoading(false);
			},
		});
	}

	return (
		<>
			<ConfirmationModal
				loading={loading}
				error={error}
				title={t('version.delete_version')}
				alertTitle={t('version.delete_alert_title')}
				alertDescription={t('version.delete_alert_desc')}
				description={
					<Trans
						i18nKey='version.delete_confirm_description'
						values={{ confirmCode }}
						components={{
							confirmCode: <span className='font-bold text-default' />,
						}}
					/>
				}
				confirmCode={confirmCode}
				onConfirm={onConfirm}
				isOpen={deleteVersionDrawerIsOpen}
				closeModal={() => useVersionStore.setState({ deleteVersionDrawerIsOpen: false })}
				closable
			/>
			<DropdownMenu>
				<div className='w-[210px] h-10 relative rounded-sm overflow-hidden flex items-center'>
					<Button
						variant='blank'
						className='flex items-center px-1.5 h-full w-full hover:bg-wrapper-background-hover transition font-normal rounded-sm'
						onClick={navigateToDashboard}
					>
						<div className='w-7 h-7 bg-subtle flex items-center justify-center rounded p-[6px] text-icon-base mr-2'>
							{version?.readOnly ? (
								<LockSimple size={20} className='text-elements-red' />
							) : (
								<LockSimpleOpen size={20} className='text-elements-green' />
							)}
						</div>
						<div className='text-left flex-1 font-sfCompact h-full flex flex-col justify-center'>
							<div className=' text-xs leading-none text-default whitespace-nowrap truncate max-w-[12ch]'>
								{version?.name}
							</div>
							<div className='text-xs text-subtle'>
								{version?.readOnly ? 'Read Only' : 'Read/Write'}
							</div>
						</div>
					</Button>
					<DropdownMenuTrigger asChild>
						<Button
							variant='icon'
							className='absolute z-50 top-1 right-0 text-icon-base p-1.5'
							rounded
							size='sm'
						>
							<CaretUpDown size={20} />
						</Button>
					</DropdownMenuTrigger>
				</div>

				<DropdownMenuContent align='end' className='min-w-[210px]'>
					<DropdownMenuItemContainer>
						{versionDropdownItems.map((option) => (
							<DropdownMenuItem
								onClick={option.action}
								key={option.title}
								disabled={option.disabled}
							>
								<option.icon className='w-5 h-5 mr-2' />
								{option.title}
							</DropdownMenuItem>
						))}
						{!version?.master && (
							<Fragment>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={() => useVersionStore.setState({ deleteVersionDrawerIsOpen: true })}
								>
									<Trash className='w-5 h-5 mr-2' />
									{t('version.delete')}
								</DropdownMenuItem>
							</Fragment>
						)}
					</DropdownMenuItemContainer>
					<DropdownMenuSub>
						<DropdownMenuSubTrigger className='dropdown-item flex items-center gap-2'>
							<GearSix className='w-5 h-5' />
							{t('version.settings.default')}
						</DropdownMenuSubTrigger>
						<DropdownMenuPortal>
							<DropdownMenuSubContent
								className='dropdown-content data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade'
								sideOffset={2}
								alignOffset={-5}
							>
								{VERSION_SETTINGS_MENU_ITEMS.map((item) => (
									<DropdownMenuItem onClick={() => handleAddTab(item)} asChild key={item.id}>
										<div className='flex items-center gap-2'>
											{getIcon(item.type)}
											{item.title}
										</div>
									</DropdownMenuItem>
								))}
							</DropdownMenuSubContent>
						</DropdownMenuPortal>
					</DropdownMenuSub>
				</DropdownMenuContent>
			</DropdownMenu>
		</>
	);
}
