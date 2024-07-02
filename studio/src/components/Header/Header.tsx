import { Agnost } from '@/components/icons';
import { MENU_ITEMS } from '@/constants';
import { AuthUserDropdown } from '@/features/auth/AuthUserDropdown';
import { ReleaseDropdown } from '@/features/cluster';
import { OrganizationDropdown } from '@/features/organization/OrganizationDropdown';
import EnvironmentDropdown from '@/features/projects/EnvironmentDropdown';
import ProjectSelectDropdown from '@/features/projects/ProjectSelectDropdown';
import _ from 'lodash';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../Button';
import { Separator } from '../Separator';
import Feedback from './Feedback';
import './header.scss';
import NotificationDropdown from '@/features/auth/Notifications/NotificationDropdown';

export function Header() {
	const { orgId, projectId, envId } = useParams();

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
							<EnvironmentDropdown />
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
					<ReleaseDropdown />
					<NotificationDropdown />
					<div className='header-menu-right-actions-user ml-2'>
						<AuthUserDropdown />
					</div>
				</div>
			</div>
		</header>
	);
}
