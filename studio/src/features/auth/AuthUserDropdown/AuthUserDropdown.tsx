import { resetAllStores } from '@/helpers';
import useApplicationStore from '@/store/app/applicationStore';
import useAuthStore from '@/store/auth/authStore.ts';
import useEnvironmentStore from '@/store/environment/environmentStore';
import useOrganizationStore from '@/store/organization/organizationStore';
import useResourceStore from '@/store/resources/resourceStore';
import useThemeStore from '@/store/theme/themeStore.ts';
import useVersionStore from '@/store/version/versionStore';
import { cn, leaveChannel } from '@/utils';
import {
	CodeBlock,
	GearSix,
	Laptop,
	LineSegments,
	MoonStars,
	SignOut,
	SunDim,
} from '@phosphor-icons/react';
import { AuthUserAvatar } from 'components/AuthUserAvatar';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuItemContainer,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from 'components/Dropdown';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';

export default function AuthUserDropdown() {
	const { user, logout, toggleEditorSettingsDrawer } = useAuthStore();
	const { orgId } = useParams() as { orgId: string };
	const { t } = useTranslation();
	const { setTheme, getTheme } = useThemeStore();
	const navigate = useNavigate();
	const { version } = useVersionStore();
	const { organizations } = useOrganizationStore();
	const { application, applications } = useApplicationStore();
	const { environment, resources: envResources } = useEnvironmentStore();
	const { resources } = useResourceStore();
	const THEMES = [
		{
			id: 'light',
			title: 'Light',
			icon: <SunDim className='text-lg' />,
		},
		{
			id: 'dark',
			title: 'Dark',
			icon: <MoonStars className='text-lg' />,
		},
		{
			id: 'system',
			title: 'System',
			icon: <Laptop className='text-lg' />,
		},
	];

	function logoutHandler() {
		logout({
			onSuccess: () => {
				leaveChannel(orgId);
				leaveChannel(version?._id ?? '');
				leaveChannel(application?._id ?? '');
				leaveChannel(environment?._id ?? '');
				resources?.forEach((resource) => {
					leaveChannel(resource._id);
				});
				organizations?.forEach((org) => {
					leaveChannel(org._id);
				});
				applications?.forEach((app) => {
					leaveChannel(app._id);
				});
				envResources?.forEach((envResource) => {
					leaveChannel(envResource._id);
				});
				leaveChannel('cluster');
				leaveChannel(user?._id ?? '');
				resetAllStores();
				navigate('/login');
			},
		});
	}
	return (
		<DropdownMenu>
			<DropdownMenuTrigger>
				<AuthUserAvatar size='sm' />
			</DropdownMenuTrigger>
			<DropdownMenuContent className='w-[210px]' align='end'>
				<DropdownMenuLabel className='p-3 gap-2 flex flex-col items-center justify-center'>
					<AuthUserAvatar size='md' />
					<div className='font-normal text-center -space-y-1'>
						<div className='text-sm text-default leading-6'>{user?.name}</div>
						<div className='text-[11px] text-subtle leading-[21px]'>{user?.contactEmail}</div>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />

				<DropdownMenuItemContainer>
					<DropdownMenuItem asChild>
						<Link className={cn('flex items-center gap-2')} to={'/profile'}>
							<GearSix className='text-icon-base text-lg' />
							{t('general.account_settings')}
						</Link>
					</DropdownMenuItem>
					{user?.isClusterOwner && (
						<DropdownMenuItem asChild>
							<Link className={cn('flex items-center gap-2')} to={'/profile/cluster-management'}>
								<LineSegments className='text-icon-base text-lg' />
								{t('profileSettings.clusters_title')}
							</Link>
						</DropdownMenuItem>
					)}

					<DropdownMenuSub>
						<DropdownMenuSubTrigger className='dropdown-item flex items-center gap-2'>
							<SunDim className='text-icon-base text-lg' />
							Theme
						</DropdownMenuSubTrigger>
						<DropdownMenuPortal>
							<DropdownMenuSubContent
								className='dropdown-content data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade'
								sideOffset={2}
								alignOffset={-5}
							>
								{THEMES.map((t) => (
									<DropdownMenuItem
										onClick={() => setTheme(t.id, user?._id ?? '')}
										asChild
										key={t.id}
										className={cn({
											' text-brand-primary': t.id === getTheme(user?._id ?? ''),
										})}
									>
										<span className='flex items-center gap-1'>
											{t.icon}
											{t.title}
										</span>
									</DropdownMenuItem>
								))}
							</DropdownMenuSubContent>
						</DropdownMenuPortal>
					</DropdownMenuSub>

					<DropdownMenuItem className='gap-2' onClick={toggleEditorSettingsDrawer}>
						<CodeBlock className='text-icon-base text-lg' />
						{t('profileSettings.editor_settings')}
					</DropdownMenuItem>
				</DropdownMenuItemContainer>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={logoutHandler}>
					<SignOut className='text-icon-base text-lg mr-2' />
					{t('general.logout')}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
