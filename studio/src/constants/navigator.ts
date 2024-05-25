import {
	BooleanFilter,
	CellEditor,
	DefaultFilter,
	EnumFilter,
	GeoPointEditor,
	GeopointFilter,
	JsonEditor,
	Link,
	Reference,
	SubObject,
} from '@/features/database/models/Navigator';

import { ConditionsType, FieldTypes, Operators } from '@/types';
import { DATE_FORMAT, DATE_TIME_FORMAT, TIME_FORMAT_WITH_SECONDS } from '@/utils';
import { Replacement } from '@react-input/mask';
import { ElementType } from 'react';

export const NavigatorCellEditorMap: Record<FieldTypes, string | ElementType> = {
	[FieldTypes.TEXT]: 'agTextCellEditor',
	[FieldTypes.BOOLEAN]: 'agCheckboxCellEditor',
	[FieldTypes.ENUM]: 'agSelectCellEditor',
	[FieldTypes.JSON]: JsonEditor,
	[FieldTypes.TIME]: CellEditor,
	[FieldTypes.DATE]: CellEditor,
	[FieldTypes.DATETIME]: CellEditor,
	[FieldTypes.LINK]: 'agTextCellEditor',
	[FieldTypes.REFERENCE]: 'reference',
	[FieldTypes.ID]: 'agTextCellEditor',
	[FieldTypes.RICH_TEXT]: 'agLargeTextCellEditor',
	[FieldTypes.ENCRYPTED_TEXT]: 'agTextCellEditor',
	[FieldTypes.EMAIL]: CellEditor,
	[FieldTypes.PHONE]: CellEditor,
	[FieldTypes.INTEGER]: 'agNumberCellEditor',
	[FieldTypes.DECIMAL]: 'agNumberCellEditor',
	[FieldTypes.CREATED_AT]: 'agDateStringCellEditor',
	[FieldTypes.UPDATED_AT]: 'agDateStringCellEditor',
	[FieldTypes.GEO_POINT]: GeoPointEditor,
	[FieldTypes.BINARY]: 'agLargeTextCellEditor',
	[FieldTypes.BASIC_VALUES_LIST]: 'agTextCellEditor',
	[FieldTypes.OBJECT]: 'agLargeTextCellEditor',
	[FieldTypes.OBJECT_LIST]: 'agLargeTextCellEditor',
};
export const CellTypeMap: Record<FieldTypes, string> = {
	[FieldTypes.TEXT]: 'text',
	[FieldTypes.BOOLEAN]: 'boolean',
	[FieldTypes.ENUM]: 'text',
	[FieldTypes.JSON]: 'object',
	[FieldTypes.TIME]: 'text',
	[FieldTypes.DATE]: 'date',
	[FieldTypes.DATETIME]: 'date',
	[FieldTypes.LINK]: 'text',
	[FieldTypes.REFERENCE]: 'text',
	[FieldTypes.ID]: 'text',
	[FieldTypes.RICH_TEXT]: 'text',
	[FieldTypes.ENCRYPTED_TEXT]: 'text',
	[FieldTypes.EMAIL]: 'text',
	[FieldTypes.PHONE]: 'text',
	[FieldTypes.INTEGER]: 'number',
	[FieldTypes.DECIMAL]: 'number',
	[FieldTypes.CREATED_AT]: 'date',
	[FieldTypes.UPDATED_AT]: 'date',
	[FieldTypes.GEO_POINT]: 'geopoint',
	[FieldTypes.BINARY]: 'text',
	[FieldTypes.BASIC_VALUES_LIST]: 'text',
	[FieldTypes.OBJECT]: 'text',
	[FieldTypes.OBJECT_LIST]: 'text',
};

export const CellRendererMap: Record<string, ElementType> = {
	[FieldTypes.LINK]: Link,
	[FieldTypes.REFERENCE]: Reference,
	[FieldTypes.OBJECT]: SubObject,
	[FieldTypes.OBJECT_LIST]: SubObject,
};

export const CellFilterMap: Record<FieldTypes, ElementType | undefined> = {
	[FieldTypes.ID]: DefaultFilter,
	[FieldTypes.TEXT]: DefaultFilter,
	[FieldTypes.RICH_TEXT]: DefaultFilter,
	[FieldTypes.ENCRYPTED_TEXT]: undefined,
	[FieldTypes.EMAIL]: DefaultFilter,
	[FieldTypes.LINK]: DefaultFilter,
	[FieldTypes.PHONE]: DefaultFilter,
	[FieldTypes.BOOLEAN]: BooleanFilter,
	[FieldTypes.INTEGER]: DefaultFilter,
	[FieldTypes.DECIMAL]: DefaultFilter,
	[FieldTypes.CREATED_AT]: DefaultFilter,
	[FieldTypes.UPDATED_AT]: DefaultFilter,
	[FieldTypes.DATETIME]: DefaultFilter,
	[FieldTypes.DATE]: DefaultFilter,
	[FieldTypes.TIME]: DefaultFilter,
	[FieldTypes.ENUM]: EnumFilter,
	[FieldTypes.GEO_POINT]: GeopointFilter,
	[FieldTypes.BINARY]: undefined,
	[FieldTypes.JSON]: undefined,
	[FieldTypes.REFERENCE]: DefaultFilter,
	[FieldTypes.BASIC_VALUES_LIST]: undefined,
	[FieldTypes.OBJECT]: undefined,
	[FieldTypes.OBJECT_LIST]: undefined,
};
export const CellMaskMap: Record<string, { mask: string; replacement: Replacement }> = {
	[FieldTypes.PHONE]: {
		mask: '+____________',
		replacement: { _: /\d/ },
	},
	[FieldTypes.TIME]: {
		mask: TIME_FORMAT_WITH_SECONDS,
		replacement: { H: /\d/, m: /\d/, s: /\d/ },
	},
	[FieldTypes.DATE]: {
		mask: DATE_FORMAT,
		replacement: { y: /\d/, M: /\d/, d: /\d/ },
	},
	[FieldTypes.DATETIME]: {
		mask: DATE_TIME_FORMAT,
		replacement: { y: /\d/, M: /\d/, d: /\d/, H: /\d/, m: /\d/, s: /\d/ },
	},
	[FieldTypes.CREATED_AT]: {
		mask: DATE_TIME_FORMAT,
		replacement: { y: /\d/, M: /\d/, d: /\d/, H: /\d/, m: /\d/, s: /\d/ },
	},
	[FieldTypes.UPDATED_AT]: {
		mask: DATE_TIME_FORMAT,
		replacement: { y: /\d/, M: /\d/, d: /\d/, H: /\d/, m: /\d/, s: /\d/ },
	},
};

export const FILTERS = [
	{ label: 'Equals', value: ConditionsType.Equals },
	{ label: 'Does not equal', value: ConditionsType.NotEquals },
	{ label: 'Is Null', value: ConditionsType.IsNull },
	{ label: 'Is Not null', value: ConditionsType.IsNotNull },
];

export const TEXT_FILTERS = [
	{ label: 'Contains', value: ConditionsType.Contains },
	{ label: 'Does not contain', value: ConditionsType.NotContains },
	{ label: 'Begins with', value: ConditionsType.BeginsWith },
	{ label: 'Ends with', value: ConditionsType.EndsWith },
	...FILTERS,
];

export const NUMBER_FILTERS = [
	{ label: 'Greater than', value: ConditionsType.GreaterThan },
	{ label: 'Greater than or equal', value: ConditionsType.GreaterThanOrEqual },
	{ label: 'Less than', value: ConditionsType.LessThan },
	{ label: 'Less than or equal', value: ConditionsType.LessThanOrEqual },
	...FILTERS,
];
export const DATE_FILTERS = [
	{ label: 'Greater than', value: ConditionsType.GreaterThan },
	{ label: 'Less than', value: ConditionsType.LessThan },
	...FILTERS,
];

export const ID_FILTERS = [
	{ label: 'Greater than', value: ConditionsType.GreaterThan },
	{ label: 'Greater than or equal', value: ConditionsType.GreaterThanOrEqual },
	{ label: 'Less than', value: ConditionsType.LessThan },
	{ label: 'Less than or equal', value: ConditionsType.LessThanOrEqual },
	{ label: 'Equals', value: ConditionsType.Equals },
	{ label: 'Does not equal', value: ConditionsType.NotEquals },
];

export const BOOLEAN_FILTERS = [
	{ label: 'True', value: 'true' },
	{ label: 'False', value: 'false' },
];

export const GeoPointFilterTypes = [
	{ label: 'Distance Greater than', value: ConditionsType.DistanceGreaterThan },
	{ label: 'Distance Less than', value: ConditionsType.DistanceLessThan },
];

export const MONGODB_FILTERS = [
	{ label: 'Is Empty', value: ConditionsType.IsEmpty },
	{ label: 'Is Not Empty', value: ConditionsType.IsNotEmpty },
];

export const OPERATORS = [
	{ label: 'And', value: Operators.And },
	{ label: 'Or', value: Operators.Or },
	{ label: 'None', value: Operators.None },
];
export const QUERY_TEMPLATES = {
	contains: { $includes: [] },
	notContains: { $not: { $includes: [] } },
	beginsWith: { $startsWith: [] },
	endsWith: { $endsWith: [] },
	greaterThan: { $gt: [] },
	greaterThanOrEqual: { $gte: [] },
	lessThan: { $lt: [] },
	lessThanOrEqual: { $lte: [] },
	equals: { $eq: [] },
	notEquals: { $ne: [] },
	isNull: { $eq: [] },
	isNotNull: { $neq: [] },
	isEmpty: { $not: { $exists: '' } },
	isNotEmpty: { $exists: '' },
	includes: { $in: [] },
	distanceLessThan: {
		$lt: [],
	},
	distanceGreaterThan: {
		$gt: [],
	},
};
export const MONGO_QUERY_TEMPLATES: Record<Partial<ConditionsType>, any> = {
	[ConditionsType.Contains]: { $regex: 'value', $options: 'i' },
	[ConditionsType.NotContains]: { $regex: '^((?!value).)*$', $options: 'i' },
	[ConditionsType.BeginsWith]: { $regex: '^value', $options: 'i' },
	[ConditionsType.EndsWith]: { $regex: 'value$', $options: 'i' },
	[ConditionsType.DistanceGreaterThan]: undefined,
	[ConditionsType.DistanceLessThan]: undefined,
	[ConditionsType.GreaterThan]: { $gt: undefined },
	[ConditionsType.GreaterThanOrEqual]: { $gte: undefined },
	[ConditionsType.LessThan]: { $lt: undefined },
	[ConditionsType.LessThanOrEqual]: { $lte: undefined },
	[ConditionsType.Equals]: { $eq: undefined },
	[ConditionsType.NotEquals]: { $ne: undefined },
	[ConditionsType.IsEmpty]: {
		$eq: [
			{
				$type: undefined,
			},
			'missing',
		],
	},
	[ConditionsType.IsNotEmpty]: {
		$ne: [
			{
				$type: undefined,
			},
			'missing',
		],
	},
	[ConditionsType.IsNull]: { $eq: null },
	[ConditionsType.IsNotNull]: { $ne: null },
	[ConditionsType.Includes]: { $in: undefined },
};
