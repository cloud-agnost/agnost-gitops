import { Button } from '@/components/Button';
import { Description } from '@/components/Description';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import { Input } from '@/components/Input';
import { Label } from '@/components/Label';
import { ADD_RESOURCE_TABS } from '@/constants';
import { OrganizationMenuItem } from '@/features/organization';
import { UpdateAllowedRoles, UpdateResourceAccessConf } from '@/features/resources';
import { useToast } from '@/hooks';
import useResourceStore from '@/store/resources/resourceStore';
import { ResourceCreateType } from '@/types';
import { cn } from '@/utils';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useSearchParams } from 'react-router-dom';
import EditSize from './EditSize';
import EditTcpProxy from './EditTcpProxy';
import EditVersionAndReplica from './EditVersionAndReplica';

export default function EditResourceDrawer() {
	const { t } = useTranslation();
	const [searchParams, setSearchParams] = useSearchParams();
	const { isEditResourceModalOpen, closeEditResourceModal } = useResourceStore();
	const { resourceToEdit, resourceConfig, restartManagedResource } = useResourceStore();
	const { toast } = useToast();
	const { orgId } = useParams() as Record<string, string>;
	const { isPending, mutateAsync: restartResource } = useMutation({
		mutationFn: () => restartManagedResource({ resourceId: resourceToEdit._id, orgId }),
		mutationKey: ['restartManagedResource'],
		onSuccess: () => {
			toast({
				title: t('resources.restart_success') as string,
				action: 'success',
			});
		},
		onError: (err) => {
			toast({
				title: err.details,
				action: 'error',
			});
		},
	});

	function closeDrawer(open: boolean) {
		if (open) return;
		closeEditResourceModal();
		searchParams.delete('t');
		setSearchParams(searchParams);
	}

	useEffect(() => {
		if (isEditResourceModalOpen) {
			searchParams.set('t', ADD_RESOURCE_TABS[0].href);
			setSearchParams(searchParams);
		}
	}, [isEditResourceModalOpen]);
	return (
		<Drawer open={isEditResourceModalOpen} onOpenChange={closeDrawer}>
			<DrawerContent position='right' size='lg'>
				<DrawerHeader className={cn(resourceToEdit.managed && 'border-none')}>
					<DrawerTitle>{t('resources.edit')}</DrawerTitle>
				</DrawerHeader>
				{resourceToEdit.managed && (
					<ul className='flex border-b'>
						{ADD_RESOURCE_TABS.map((item) => {
							return (
								<OrganizationMenuItem
									key={item.name}
									item={item}
									active={window.location.search.includes(item.href)}
								/>
							);
						})}
					</ul>
				)}
				<div className='px-6 py-4 scroll space-y-8'>
					{searchParams.get('t') === ADD_RESOURCE_TABS[0].href ? (
						<>
							<div>
								<Label>{t('general.name')}</Label>
								<Input disabled value={resourceToEdit.name} />
							</div>
							<UpdateAllowedRoles />
							{resourceConfig.type === ResourceCreateType.Existing && <UpdateResourceAccessConf />}
							{resourceConfig.type === ResourceCreateType.New && (
								<>
									<EditSize />
									<EditVersionAndReplica />
								</>
							)}

							{resourceToEdit.managed && (
								<Description title={`Restart ${resourceToEdit.instance} server`}>
									<div className='flex items-center justify-between gap-6'>
										<p>
											Please be informed that if you restart your resource you might observe
											interruption in resource services until it completes its restart.
										</p>
										<Button loading={isPending} onClick={restartResource}>
											{t('general.restart')}
										</Button>
									</div>
								</Description>
							)}
						</>
					) : (
						<EditTcpProxy />
					)}
				</div>
			</DrawerContent>
		</Drawer>
	);
}
