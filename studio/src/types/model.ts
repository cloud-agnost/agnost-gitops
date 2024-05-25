import { GetDatabasesOfAppParams } from '@/types/database.ts';
import { BaseRequest } from './type';

export interface Model {
	orgId: string;
	appId: string;
	versionId: string;
	dbId: string;
	iid: string;
	name: string;
	type: string;
	description: string;
	parentiid?: string;
	timestamps: {
		enabled: boolean;
		createdAt: string;
		updatedAt: string;
	};
	fields: Field[];
	createdBy: string;
	updatedBy: string;
	_id: string;
	createdAt: string;
	updatedAt: string;
	__v: number;
}
export enum FieldTypes {
	ID = 'id',
	TEXT = 'text',
	RICH_TEXT = 'rich-text',
	ENCRYPTED_TEXT = 'encrypted-text',
	EMAIL = 'email',
	LINK = 'link',
	PHONE = 'phone',
	BOOLEAN = 'boolean',
	INTEGER = 'integer',
	DECIMAL = 'decimal',
	CREATED_AT = 'createdat',
	UPDATED_AT = 'updatedat',
	DATETIME = 'datetime',
	DATE = 'date',
	TIME = 'time',
	ENUM = 'enum',
	GEO_POINT = 'geo-point',
	BINARY = 'binary',
	JSON = 'json',
	REFERENCE = 'reference',
	BASIC_VALUES_LIST = 'basic-values-list',
	OBJECT = 'object',
	OBJECT_LIST = 'object-list',
}
export interface Field {
	name: string;
	iid: string;
	creator: 'system' | 'user';
	type: FieldTypes;
	description: string;
	defaultValue: string;
	dbType: string;
	order: number;
	required: boolean;
	unique: boolean;
	immutable: boolean;
	indexed: boolean;
	createdBy: string;
	updatedBy: string;
	_id: string;
	createdAt: string;
	updatedAt: string;
	text?: {
		searchable: boolean;
		maxLength: number;
		language: string;
	};
	richText?: {
		searchable: boolean;
		language: string;
	};
	encryptedText?: {
		maxLength: number;
	};
	decimal?: {
		decimalDigits: number;
	};
	object?: {
		iid: string;
		timestamps: {
			enabled: boolean;
			createdAt: string;
			updatedAt: string;
		};
	};
	objectList?: {
		iid: string;
		timestamps: {
			enabled: boolean;
			createdAt: string;
			updatedAt: string;
		};
	};
	reference?: {
		iid: string;
		action: ReferenceAction;
	};
	enum?: {
		selectList: string[];
	};
}

export type GetModelsOfDatabaseParams = Omit<GetDatabasesOfAppParams, 'modelId'> & {
	dbId: string;
	workspace?: boolean;
};
export type GetSpecificModelByIidOfDatabase = GetModelsOfDatabaseParams &
	BaseRequest & {
		modelIid: string;
	};
export type GetSpecificModelOfDatabase = GetModelsOfDatabaseParams & {
	modelId: string;
};

export type CreateModelParams = GetModelsOfDatabaseParams & {
	name: string;
	description?: string;
	timestamps: {
		enabled: boolean;
		createdAt?: string;
		updatedAt?: string;
	};
};

export type DeleteModelParams = GetModelsOfDatabaseParams & {
	modelId: string;
};

export type DeleteMultipleModelParams = GetModelsOfDatabaseParams & {
	modelIds: string[];
};

export type UpdateNameAndDescriptionParams = GetModelsOfDatabaseParams & {
	modelId: string;
	name: string;
	description?: string;
};
export type DeleteFieldParams = GetModelsOfDatabaseParams & {
	modelId: string;
	fieldId: string;
};
export type DeleteMultipleFieldParams = GetModelsOfDatabaseParams & {
	modelId: string;
	fieldIds: string[];
};
export type AddNewFieldParams = GetModelsOfDatabaseParams & {
	type: string;
	modelId: string;
	name: string;
	description?: string;
	required: boolean;
	unique: boolean;
	immutable: boolean;
	indexed: boolean;
	defaultValue?: string | number | boolean;
	text?: {
		searchable: boolean;
		maxLength: number;
		language?: string;
	};
	richText?: {
		searchable: boolean;
		language?: string;
	};
	encryptedText?: {
		maxLength: number;
	};
	decimal?: {
		decimalDigits: number;
	};
	enum?: {
		selectList: string[];
	};
	object?: {
		timestamps: {
			enabled: boolean;
			createdAt: string;
			updatedAt: string;
		};
	};
	objectList?: {
		timestamps: {
			enabled: boolean;
			createdAt: string;
			updatedAt: string;
		};
	};
	reference?: {
		iid: string;
		action: ReferenceAction;
	};
	basicValuesList?: {
		type: BasicValueListType;
	};
};

export type UpdateFieldParams = AddNewFieldParams & {
	fieldId: string;
};

export type EnableTimestampsParams = GetSpecificModelOfDatabase & {
	createdAt: string;
	updatedAt: string;
};
export type DisableTimestampsParams = GetSpecificModelOfDatabase & object;

export type BasicValueListType =
	| 'text'
	| 'integer'
	| 'decimal'
	| 'datetime'
	| 'email'
	| 'link'
	| 'phone';

export type ReferenceAction = 'CASCADE' | 'NO ACTION' | 'SET NULL' | 'SET DEFAULT';
