import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function useSearch(data: any[]) {
	const [searchParams] = useSearchParams();

	const filteredData = useMemo(() => {
		if (searchParams.get('q')) {
			const query = new RegExp(searchParams.get('q') as string, 'i');
			return data.filter((item) => query.test(item.name));
		}
		return data;
	}, [searchParams.get('q'), data]);

	return filteredData;
}
