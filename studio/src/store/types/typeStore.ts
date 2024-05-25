import TypesService from '@/services/TypesService';
import {
	APIError,
	FieldType,
	OAuthProviderParams,
	OAuthProviderTypes,
	PhoneAuthSMSProviderParams,
	ResourceType,
	Types,
} from '@/types';
import { PhoneAuthSMSProviders } from '@/types/type';
import { create } from 'zustand';

import { devtools, persist } from 'zustand/middleware';
interface TypesStore {
	orgRoles: string[];
	appRoles: string[];
	projectRoles: string[];
	orgRoleDesc: Record<string, string>;
	appRoleDesc: Record<string, string>;
	projectRoleDesc: Record<string, string>;
	bvlTypes: string[];
	fieldTypes: FieldType[];
	databaseTypes: string[];
	ftsIndexLanguages: {
		PostgreSQL: {
			value: string;
			name: string;
		}[];
		MySQL: {
			value: string;
			name: string;
		}[];
		MongoDB: {
			value: string;
			name: string;
		}[];
		'SQL Server': {
			value: string;
			name: string;
		}[];
	};
	instanceTypes: {
		engine: string[];
		database: string[];
		cache: string[];
		storage: string[];
		queue: string[];
		scheduler: string[];
		realtime: string[];
	};
	phoneAuthSMSProviders: {
		provider: PhoneAuthSMSProviders;
		params: {
			name: PhoneAuthSMSProviderParams;
			title: string;
			type: string;
			description: string;
			multiline: boolean;
		}[];
	}[];
	oAuthProviderTypes: {
		provider: OAuthProviderTypes;
		params: {
			name: OAuthProviderParams;
			title: string;
			type: string;
			multiline: boolean;
		}[];
	}[];
	authUserDataModel: {
		name: string;
		type: string;
	}[];
	resourceTypes: ResourceType[];
	isTypesOk: boolean;
	resourceVersions: {
		[key: string]: string[];
	};
	timezones: {
		label: string;
		name: string;
		value: string;
		utc: string;
	}[];
	getAllTypes: () => Promise<Types | APIError>;
}

const useTypeStore = create<TypesStore>()(
	devtools(
		persist(
			(set) => ({
				orgRoles: [],
				appRoles: [],
				projectRoles: [],
				orgRoleDesc: {},
				appRoleDesc: {},
				projectRoleDesc: {},
				bvlTypes: [],
				fieldTypes: [],
				databaseTypes: [],
				instanceTypes: {
					engine: [],
					database: [],
					cache: [],
					storage: [],
					queue: [],
					scheduler: [],
					realtime: [],
				},
				ftsIndexLanguages: {
					PostgreSQL: [],
					MySQL: [],
					MongoDB: [],
					'SQL Server': [],
				},
				phoneAuthSMSProviders: [
					{
						provider: PhoneAuthSMSProviders.TWILIO,
						params: [
							{
								name: 'accountSID',
								title: '',
								type: '',
								description: '',
								multiline: false,
							},
						],
					},
				],
				oAuthProviderTypes: [
					{
						provider: OAuthProviderTypes.Google,
						params: [
							{
								name: 'key',
								title: '',
								type: '',
								multiline: true,
							},
						],
					},
				],
				authUserDataModel: [
					{
						name: '',
						type: '',
					},
				],
				resourceVersions: {},
				isTypesOk: false,
				resourceTypes: [],
				timezones: [],
				getAllTypes: async () => {
					try {
						const res = await TypesService.getAllTypes();
						set({
							...res,
							isTypesOk: true,
						});
						return res;
					} catch (error) {
						throw error as APIError;
					}
				},
			}),
			{
				name: 'type-store',
			},
		),
	),
);
export default useTypeStore;
