import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import useClusterStore from '@/store/cluster/clusterStore';
import { DialogProps } from '@radix-ui/react-dialog';
import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { OrganizationMenuItem } from '../organization';
import { CLUSTER_MENU_ITEMS } from '@/constants';
import { useSearchParams } from 'react-router-dom';
import ClusterManagementGeneral from './ClusterManagementGeneral';
import ClusterManagementUsage from './ClusterManagementUsage';
import { useEffect } from 'react';

export default function ClusterManagement(props: DialogProps) {
	const { t } = useTranslation();
	const { checkDomainStatus, clusterDomainError } = useClusterStore();
	const [searchParams, setSearchParams] = useSearchParams();
	useQuery({
		queryFn: checkDomainStatus,
		queryKey: ['checkDomainStatus'],
		retry: false,
		enabled: _.isNil(clusterDomainError),
	});

	useEffect(() => {
		if (props.open) setSearchParams({ cm: 'general' });
		else setSearchParams({});
	}, [props.open]);

	return (
		<Drawer {...props}>
			<DrawerContent>
				<DrawerHeader className='border-none'>
					<DrawerTitle>{t('profileSettings.clusters_title')}</DrawerTitle>
				</DrawerHeader>
				<nav className='flex border-b'>
					{CLUSTER_MENU_ITEMS.map((item) => {
						return (
							<OrganizationMenuItem
								key={item.name}
								item={item}
								active={searchParams.get('cm') === item.href}
								urlKey='cm'
							/>
						);
					})}
				</nav>
				{searchParams.get('cm') === 'general' && <ClusterManagementGeneral />}
				{searchParams.get('cm') === 'usage' && <ClusterManagementUsage />}
			</DrawerContent>
		</Drawer>
	);
}
