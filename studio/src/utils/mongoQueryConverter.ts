import { MONGO_QUERY_TEMPLATES } from '@/constants';
import { ColumnFilters, Condition, ConditionsType } from '@/types';

function generateQuery({ condition, columnName }: { condition: Condition; columnName: string }) {
	if (!condition) return;

	const queryTemplate = { ...MONGO_QUERY_TEMPLATES[condition.type ?? ConditionsType.Equals] }; // Clone to avoid mutating the template
	if (!queryTemplate) return;

	if (condition.type === 'notContains') {
		queryTemplate.$regex = `^((?!${condition.filter}).)*$`;
		return {
			[columnName]: queryTemplate,
		};
	}

	if (condition.type === 'beginsWith') {
		queryTemplate.$regex = `^${condition.filter}`;
		return {
			[columnName]: queryTemplate,
		};
	}

	if (condition.type === 'endsWith') {
		queryTemplate.$regex = `${condition.filter}$`;
		return {
			[columnName]: queryTemplate,
		};
	}

	if (condition.type === 'isEmpty') {
		queryTemplate.$eq[0].$type = columnName;
		return {
			[columnName]: queryTemplate,
		};
	}

	if (condition.type === 'isNotEmpty') {
		queryTemplate.$ne[0].$type = columnName;
		return {
			[columnName]: queryTemplate,
		};
	}

	// For the rest of the conditions
	const operator = Object.keys(queryTemplate)[0];
	queryTemplate[operator] = condition.filter;

	return { [columnName]: queryTemplate };
}

export function mongoQueryConverter(filters: ColumnFilters) {
	const convertedQuery: any[] = [];
	Object.entries(filters).forEach(([key, { conditions, operator }]) => {
		if (conditions.length > 1) {
			const compoundQuery = conditions.map((condition: Condition) =>
				generateQuery({ condition, columnName: key }),
			);
			convertedQuery.push({ [operator ?? '$and']: compoundQuery });
		} else {
			const query = generateQuery({
				condition: conditions[0],
				columnName: key,
			});
			convertedQuery.push(query);
		}
	});
	if (convertedQuery.length === 0) return {};
	else if (convertedQuery.length === 1) return convertedQuery[0];
	else
		return {
			$and: convertedQuery,
		};
}
