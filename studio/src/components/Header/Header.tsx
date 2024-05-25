import { Agnost } from '@/components/icons';
import { MENU_ITEMS } from '@/constants';
import { ApplicationSelectDropdown } from '@/features/application';
import { AuthUserDropdown } from '@/features/auth/AuthUserDropdown';
import { ReleaseDropdown } from '@/features/cluster';
import { OrganizationDropdown } from '@/features/organization/OrganizationDropdown';
import ProjectEnvironmentDropdown from '@/features/projects/ProjectEnvironmentDropdown';
import ProjectSelectDropdown from '@/features/projects/ProjectSelectDropdown';
import { DeploymentStatusCard } from '@/features/version/DeploymentStatusCard';
import { NotificationDropdown } from '@/features/version/Notification';
import { VersionDropdown } from '@/features/version/VersionDropdown';
import { useAuthorizeVersion } from '@/hooks';
import useVersionStore from '@/store/version/versionStore';
import { MagnifyingGlass } from '@phosphor-icons/react';
import _ from 'lodash';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../Button';
import { Separator } from '../Separator';
import Feedback from './Feedback';
import './header.scss';

export function Header() {
	const { versionId, appId, orgId, projectId, envId } = useParams();
	const { toggleSearchCommandMenu } = useVersionStore();
	const canViewNotf = useAuthorizeVersion('viewLogs');
	return (
		<header className='header-menu'>
			<div className='header-menu-left'>
				<Link to='/'>
					<Agnost width='36' height='36' />
				</Link>

				<div className='flex items-center gap-4'>
					{!_.isEmpty(orgId) && (
						<>
							<Separator orientation='vertical' className='h-8 transform rotate-12' />
							<OrganizationDropdown />
						</>
					)}

					{projectId && (
						<>
							<Separator orientation='vertical' className='h-8 transform rotate-12' />
							<ProjectSelectDropdown />
						</>
					)}
					{envId && (
						<>
							<Separator orientation='vertical' className='h-8 transform rotate-12' />
							<ProjectEnvironmentDropdown />
						</>
					)}
					{appId && (
						<>
							<Separator orientation='vertical' className='h-8 transform rotate-12' />
							<ApplicationSelectDropdown />
						</>
					)}
					{versionId && (
						<>
							<Separator orientation='vertical' className='h-8 transform rotate-12' />
							<VersionDropdown />
						</>
					)}
				</div>
			</div>
			<div className='header-menu-right'>
				<nav className='header-menu-right-nav'>
					<Feedback />
					{MENU_ITEMS.map((item) => (
						<Button
							size='sm'
							key={item.title}
							variant='text'
							className='!text-subtle hover:!text-default'
							onClick={() => {
								window.open(item.url, '_blank', 'noreferrer');
							}}
						>
							<item.icon className='mr-1' />
							{item.title}
						</Button>
					))}
				</nav>
				<Separator
					orientation='vertical'
					className='h-8 transform rotate-12 invisible 2xl:visible'
				/>
				<div className='header-menu-right-actions'>
					<Button variant='icon' size='sm' rounded onClick={toggleSearchCommandMenu}>
						<MagnifyingGlass size={18} />
					</Button>
					<ReleaseDropdown />
					{versionId && (
						<>
							<DeploymentStatusCard />
							{canViewNotf && <NotificationDropdown />}
						</>
					)}

					<div className='header-menu-right-actions-user ml-2'>
						<AuthUserDropdown />
					</div>
				</div>
			</div>
		</header>
	);
}
