import { AuthUserAvatar } from '@/components/AuthUserAvatar';
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
} from '@/components/Dropdown';
import ClusterManagement from '@/features/profile/ClusterManagement';
import { useToast } from '@/hooks';
import useAuthStore from '@/store/auth/authStore.ts';
import useContainerStore from '@/store/container/containerStore';
import useEnvironmentStore from '@/store/environment/environmentStore';
import useOrganizationStore from '@/store/organization/organizationStore';
import useProjectStore from '@/store/project/projectStore';
import useThemeStore from '@/store/theme/themeStore.ts';
import { cn, leaveChannel } from '@/utils';
import { Laptop, MoonStars, SignOut, SunDim } from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ProfileSettings } from '../ProfileSettings';
export default function AuthUserDropdown() {
	const { user, logout } = useAuthStore();
	const { orgId } = useParams() as { orgId: string };
	const { t } = useTranslation();
	const { setTheme, getTheme } = useThemeStore();
	const navigate = useNavigate();
	const { organizations } = useOrganizationStore();
	const { environments } = useEnvironmentStore();
	const { projects } = useProjectStore();
	const { containers } = useContainerStore();
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
	const { toast } = useToast();
	const { mutate } = useMutation({
		mutationFn: logout,
		onSuccess: () => {
			leaveChannel(orgId);

			organizations?.forEach((org) => {
				leaveChannel(org._id);
			});
			environments?.forEach((env) => {
				leaveChannel(env._id);
			});
			projects?.forEach((project) => {
				leaveChannel(project._id);
			});
			containers?.forEach((container) => {
				leaveChannel(container._id);
			});

			leaveChannel('cluster');
			leaveChannel(user?._id ?? '');
			//TODO resetAllStores();
			navigate('/login');
		},
		onError: (error) => {
			toast({ action: 'error', title: error.details });
		},
	});

	function logoutHandler() {
		mutate();
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
						<div className='text-[11px] text-subtle leading-[21px]'>{user?.email}</div>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />

				<DropdownMenuItemContainer>
					<ProfileSettings />
					{user?.isClusterOwner && <ClusterManagement />}

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
