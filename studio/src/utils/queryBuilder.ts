import { QUERY_TEMPLATES } from '@/constants';
import { ColumnFilters, Condition, ConditionsType, Filters } from '@/types';

function generateQuery({
	condition,
	columnName,
	filterType,
}: {
	condition?: Condition;
	columnName: string;
	filterType?: string;
}): any {
	if (!condition) return;
	const query: any = QUERY_TEMPLATES[condition?.type || ConditionsType.Equals];

	const queryKeys = Object.keys(query);

	if (condition.type === ConditionsType.NotContains) {
		query.$not.$includes = [columnName, condition.filter, false];
		return query;
	}

	if (condition.type === ConditionsType.Contains) {
		query[queryKeys[queryKeys.length - 1]] = [columnName, condition?.filter ?? null, false];
		return query;
	}

	if (filterType === Filters.GeoPoint) {
		query[queryKeys[0]] = [
			{ $distance: [{ $point: condition.filter }, columnName] },
			condition.filterFrom,
		];
		return query;
	}

	if (condition.type === ConditionsType.IsEmpty) {
		query.$not.$exists = columnName;
		return query;
	}

	if (condition.type === ConditionsType.IsNotEmpty) {
		query.$exists = columnName;
		return query;
	}
	if (columnName === '_id') {
		query[queryKeys[queryKeys.length - 1]] = [
			columnName,
			{
				$toObjectId: condition?.filter ?? null,
			},
		];
	} else query[queryKeys[queryKeys.length - 1]] = [columnName, condition?.filter ?? null];
	return query;
}

export function queryBuilder(filters: ColumnFilters): any[] {
	const convertedQuery: any[] = [];
	Object.entries(filters).forEach(([key, value]) => {
		const query = generateQuery({
			condition: value.conditions[0],
			columnName: key,
			filterType: value.filterType,
		});
		if (value.conditions.length > 1) {
			const query2 = generateQuery({
				condition: value.conditions[1],
				columnName: key,
				filterType: value.filterType,
			});
			convertedQuery.push({ [value.operator as string]: [query, query2] });
			return convertedQuery;
		}
		convertedQuery.push(query);
	});
	return convertedQuery;
}
