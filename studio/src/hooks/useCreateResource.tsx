import { CREATE_RESOURCES_ELEMENTS } from '@/constants';
import useResourceStore from '@/store/resources/resourceStore';
import { useEffect, useState } from 'react';

export default function useCreateResource() {
	const { resourceConfig } = useResourceStore();
	const [createResourceElement, setCreateResourceElement] = useState(CREATE_RESOURCES_ELEMENTS[0]);

	useEffect(() => {
		setCreateResourceElement(
			CREATE_RESOURCES_ELEMENTS.find(
				(r) =>
					r.resourceType === resourceConfig.resourceType && r.instance === resourceConfig.instance,
			) || CREATE_RESOURCES_ELEMENTS[0],
		);
	}, [resourceConfig]);

	return createResourceElement;
}
