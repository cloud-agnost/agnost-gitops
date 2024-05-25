import { RESOURCE_ICON_MAP } from '@/constants';
import useEnvironmentStore from '@/store/environment/environmentStore';
import { useMemo } from 'react';

export default function InstanceType({ iid }: { iid: string }) {
	const environment = useEnvironmentStore((state) => state.environment);
	const instance = useMemo(
		() =>
			environment?.mappings?.find((mapping) => mapping.design.iid === iid)?.resource
				.instance as string,
		[environment],
	);
	const Icon = useMemo(() => RESOURCE_ICON_MAP[instance], [instance]);
	return instance ? (
		<div className='flex items-center gap-2'>
			{Icon && <Icon className='w-5 h-5' />}
			<span className='whitespace-nowrap'>{instance}</span>
		</div>
	) : (
		<span className='whitespace-nowrap'>-</span>
	);
}
