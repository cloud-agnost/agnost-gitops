import { sortByField } from '@/utils';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function useSearch(data: any[]) {
	const [searchParams] = useSearchParams();
	const field = searchParams.get('f') ?? 'name';
	const dir = (searchParams.get('d') ?? 'asc') as 'asc' | 'desc';
	const filteredData = useMemo(() => {
		if (searchParams.get('q')) {
			const query = new RegExp(searchParams.get('q') as string, 'i');
			return sortByField(
				data.filter((item) => query.test(item.name)),
				field,
				dir,
			);
		}
		return sortByField(data, field, dir);
	}, [searchParams.get('q'), searchParams.get('f'), searchParams.get('d'), data]);

	return filteredData;
}
