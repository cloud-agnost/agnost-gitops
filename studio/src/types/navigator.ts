import { Cell } from '@tanstack/react-table';
import { DatabaseTypes } from '.';
import { Field, FieldTypes } from './model';
import { BaseGetRequest, BaseRequest } from './type';

export type GetDataFromModelParams = BaseGetRequest & {
	id?: string;
	dbType: DatabaseTypes;
	filter: any;
};

export interface DeleteDataFromModelParams extends BaseRequest {
	id: string;
}
export interface DeleteMultipleDataFromModelParams extends BaseRequest {
	ids: string[];
}
export interface UpdateDataFromModelParams extends BaseRequest {
	id: string;
	isSubObjectUpdate?: boolean;
	data: any;
}
export type NavigatorComponentProps = {
	field: Field;
	parentId?: string;
	cell: Cell<any, any>;
	value: any;
	id: string | number;
	index: number;
};

export interface Condition {
	filter: string | string[] | number | number[] | boolean | null;
	filterFrom?: string | number | null;
	type?: ConditionsType;
}

export interface ColumnFilterType {
	operator?: Operators | null;
	conditions: Condition[];
	filterType: Filters;
}
export enum ConditionsType {
	Contains = 'contains',
	NotContains = 'notContains',
	BeginsWith = 'beginsWith',
	EndsWith = 'endsWith',
	GreaterThan = 'greaterThan',
	GreaterThanOrEqual = 'greaterThanOrEqual',
	LessThan = 'lessThan',
	LessThanOrEqual = 'lessThanOrEqual',
	DistanceGreaterThan = 'distanceGreaterThan',
	DistanceLessThan = 'distanceLessThan',
	Equals = 'equals',
	NotEquals = 'notEquals',
	IsEmpty = 'isEmpty',
	IsNotEmpty = 'isNotEmpty',
	IsNull = 'isNull',
	IsNotNull = 'isNotNull',
	Includes = 'includes',
}
export enum Operators {
	And = '$and',
	Or = '$or',
	None = 'none',
}

export enum Filters {
	Date = 'date',
	Number = 'number',
	Text = 'text',
	Boolean = 'boolean',
	GeoPoint = 'geopoint',
}

export interface FilterProps {
	type: FieldTypes;
	columnName: string;
	entityId: string;
	log?: boolean;
	description?: string;
}
export interface VersionColumnFilters {
	[entityId: string]: ColumnFilters | undefined;
}

export interface ColumnFilters {
	[fieldName: string]: ColumnFilterType;
}
