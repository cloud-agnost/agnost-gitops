import { Button } from '@/components/Button';
import { Dialog, DialogContent, DialogTitle } from '@/components/Dialog';
import { CREATE_RESOURCE_TYPES, RESOURCE_ICON_MAP } from '@/constants';
import useResourceStore from '@/store/resources/resourceStore';
import useTypeStore from '@/store/types/typeStore';
import { ResourceCreateType, ResourceType } from '@/types';
import { Fragment } from 'react';

export default function SelectResourceTypeModal() {
	const { instanceTypes } = useTypeStore();
	const {
		selectResourceType,
		toggleCreateResourceModal,
		selectedResourceCreateType,
		isSelectResourceTypeModalOpen,
		closeSelectResourceTypeModal,
	} = useResourceStore();

	function getIcon(type: string) {
		const Icon = RESOURCE_ICON_MAP[type];
		return <Icon className='size-6' />;
	}

	const selectResource = (resourceType: ResourceType, instance: string) => {
		selectResourceType(instance, selectedResourceCreateType as string, resourceType);
		toggleCreateResourceModal();
		closeSelectResourceTypeModal();
	};
	return (
		<Dialog open={isSelectResourceTypeModalOpen} onOpenChange={closeSelectResourceTypeModal}>
			<DialogContent>
				<DialogTitle>Select Resource Type</DialogTitle>
				<div className='space-y-2'>
					{CREATE_RESOURCE_TYPES.filter(
						(r) => selectedResourceCreateType !== ResourceCreateType.New || r !== 'storage',
					).map((resourceType) => (
						<Fragment key={resourceType}>
							{instanceTypes[resourceType as keyof typeof instanceTypes].map(
								(
									instance: string, // Add index signature to instanceTypes
								) => (
									<Button
										type='button'
										variant='blank'
										key={instance}
										onClick={() => selectResource(resourceType as ResourceType, instance)}
										className='flex-col items-center justify-center gap-2 rounded hover:bg-lighter p-6 aspect-square'
									>
										{getIcon(instance)}
										<p className='text-xs'>{instance}</p>
									</Button>
								),
							)}
						</Fragment>
					))}
				</div>
			</DialogContent>
		</Dialog>
	);
}
