import {
	FIELD_MAPPER,
	ORG_CHANGE_EXCEPTIONS,
	PARAM_REGEX,
	PHONE_REGEXES,
	VERSION_CHANGE_EXCEPTIONS,
} from '@/constants';
import { STATE_LIST } from '@/constants/stateList';
import { socket } from '@/helpers';
import { toast } from '@/hooks/useToast';
import useApplicationStore from '@/store/app/applicationStore';
import useAuthStore from '@/store/auth/authStore';
import useOrganizationStore from '@/store/organization/organizationStore';
import useProjectStore from '@/store/project/projectStore';
import useTypeStore from '@/store/types/typeStore';
import useTabStore from '@/store/version/tabStore';
import useVersionStore from '@/store/version/versionStore';
import { AppRoles, ContainerPipelineStatus, RealtimeData } from '@/types';
import { clsx, type ClassValue } from 'clsx';
import copy from 'copy-to-clipboard';
import cronstrue from 'cronstrue';
import i18next from 'i18next';
import _ from 'lodash';
import * as prettier from 'prettier';
import jsParser from 'prettier/plugins/babel';
import esTreePlugin from 'prettier/plugins/estree';
import { HTMLInputTypeAttribute } from 'react';
import { twMerge } from 'tailwind-merge';

type EmptyableArray = readonly [] | [];
type EmptyableString = '' | string;
type EmptyableObject<T extends object> = T & Record<keyof T, never>;

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function removeLastSlash(str: string) {
	if (str === '/') return str;
	return str.replace(/\/$/, '');
}
export function translate(key: string, options?: any) {
	return String(i18next.t(key, options));
}

export function joinChannel(channel: string) {
	socket.emit('channel:join', channel);
}
export function leaveChannel(channel: string) {
	socket.emit('channel:leave', channel);
}
export function sendMessageToChannel(channel: string, message: any) {
	socket.emit('channel:message', { channel, message });
}
export function offChannelMessage(channel: string) {
	socket.off(channel);
}

export function onChannelMessage<T>(channel: string, callback: (data: RealtimeData<T>) => void) {
	socket.on(channel, callback);
	return () => {
		socket.off(channel);
	};
}

export function uniq<T>(array: T[]): T[] {
	return [...new Set(array)];
}

export function isEmpty(value: unknown): boolean {
	if (value === null || value === undefined || value === '') {
		return true;
	}

	if (typeof value === 'string' || Array.isArray(value)) {
		return (value as EmptyableString | EmptyableArray).length === 0;
	}

	if (
		typeof value === 'object' &&
		Object.keys(value as EmptyableObject<Record<string, unknown>>).length === 0
	) {
		return true;
	}

	return false;
}
export function isArray<T>(value: unknown): value is T[] {
	return Array.isArray(value);
}
export function getNameForAvatar(name: string) {
	if (!name) {
		return '';
	}

	const words = name.trim().split(' ');

	if (words.length === 1) {
		if (words[0].length === 1) {
			return words[0];
		} else if (words[0].length === 2) {
			return words[0].toUpperCase();
		} else {
			return words[0].slice(0, 2).toUpperCase();
		}
	} else {
		const firstInitial = words[0][0];
		const lastInitial = words[words.length - 1][0];
		return (firstInitial + lastInitial).toUpperCase();
	}
}
export function capitalize(str: string) {
	if (typeof str !== 'string') {
		return '';
	}
	return str.charAt(0).toUpperCase() + str.slice(1);
}

export function arrayToQueryString(array: string[] | undefined, key: string) {
	return array?.map((item) => `${key}=${item}`).join('&');
}

export async function copyToClipboard(text: string) {
	try {
		copy(text, {
			format: 'text/plain',
			message: 'Press #{key} to copy',
			debug: true,
		});
		toast({
			title: translate('general.copied'),
			action: 'success',
		});
	} catch (e) {
		toast({
			title: translate('general.copied_error'),
			action: 'error',
		});
	}
}

export function reverseArray<T>(arr: T[]) {
	const reversedArray: T[] = [];

	for (let i = arr.length - 1; i >= 0; i--) {
		reversedArray.push(arr[i]);
	}

	return reversedArray;
}

export const reorder = (list: any[], startIndex: number, endIndex: number) => {
	const result = Array.from(list);
	const [removed] = result.splice(startIndex, 1);
	result.splice(endIndex, 0, removed);

	return result;
};

export function getPathParams(path: string) {
	const params: string[] = [];

	let match;
	while ((match = PARAM_REGEX.exec(path)) !== null) {
		params.push(match[1]);
	}

	return params;
}

export function getEndpointPath(path: string, params: Record<string, string>[]) {
	const pathParams = getPathParams(path);
	const paramsObj = arrayToObj(params);

	for (const param of pathParams) {
		path = path.replace(`:${param}`, paramsObj[param]);
	}

	return path;
}

export function arrayToObj(arr: Record<string, string>[]): Record<string, string> {
	return arr.reduce(
		(acc, curr) => {
			acc[curr.key] = curr.value;
			return acc;
		},
		{} as Record<string, string>,
	);
}

export function objToArray(obj: object | undefined): { key: string; value: string }[] {
	return Object.entries(obj ?? {}).map(([key, value]) => ({ key, value }));
}

export function generateId() {
	return Math.random().toString(36).substring(2, 15);
}

export function toDisplayName(name: string) {
	return name.replace(/[-_]/g, ' ').split(' ').map(capitalize).join(' ');
}

export default function groupBy<T>(list: T[], keyGetter: (item: T) => string) {
	const map: Record<string, T[]> = {};

	for (const item of list) {
		const key = keyGetter(item);
		const collection = map[key];
		if (!collection) {
			map[key] = [item];
		} else {
			collection.push(item);
		}
	}

	return map;
}

export const getAppPermission = (path: string, role?: AppRoles): boolean => {
	const { appAuthorization, application } = useApplicationStore.getState();
	const key = `${application?.role ?? role}.app.${path}`;
	return _.get(appAuthorization, key);
};
export const getProjectPermission = (path: string, role?: AppRoles): boolean => {
	const { projectAuthorization, project } = useProjectStore.getState();
	const key = `${project?.role ?? role}.project.${path}`;
	return _.get(projectAuthorization, key);
};

export const getOrgPermission = (path: string): boolean => {
	const role = useOrganizationStore.getState().organization.role;
	return _.get(useOrganizationStore.getState().orgAuthorization?.[role]?.org, path);
};
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 Bytes';

	const units: string[] = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	const base = 1024;
	const exponent: number = Math.floor(Math.log(bytes) / Math.log(base));

	return parseFloat((bytes / Math.pow(base, exponent)).toFixed(2)) + ' ' + units[exponent];
}

export function checkNumber(number: number | undefined): number | undefined {
	return number === 0 || number === undefined ? undefined : Number(number);
}

export function removeEmptyFields(data: Record<string, any>) {
	Object.keys(data).forEach((key) => {
		if (data[key] === '' || data[key] == null) {
			delete data[key];
		}
	});
	return data;
}

export function handleTabChange(name: string, url: string) {
	const { getCurrentTab, updateCurrentTab } = useTabStore.getState();
	const { version, getVersionDashboardPath } = useVersionStore.getState();
	const tab = getCurrentTab(version._id);
	const versionUrl = getVersionDashboardPath(url);
	const hasAnotherParams = versionUrl.includes('?');
	updateCurrentTab(version._id, {
		...tab,
		path: hasAnotherParams ? `${versionUrl}&tabId=${tab.id}` : `${versionUrl}?tabId=${tab.id}`,
		title: name,
	});
}

export function getInputType(fieldType: string): HTMLInputTypeAttribute {
	const { fieldTypes } = useTypeStore.getState();
	const typeGroup = fieldTypes.find((type) => type.name === fieldType)?.group;
	return typeGroup === 'numeric' ? 'number' : 'text';
}

export function updateObject(object: Record<any, any>, path: string, updater: (value: any) => any) {
	const pathArray = Array.isArray(path) ? path : path.split('.');
	const lastKey = pathArray.pop();

	let currentObject = object;
	for (const key of pathArray) {
		if (key in currentObject) {
			currentObject = currentObject[key];
		} else {
			return object;
		}
	}

	if (updater instanceof Function) {
		currentObject[lastKey] = updater(currentObject[lastKey]);
	} else {
		currentObject[lastKey] = updater;
	}

	return object;
}
export function getNestedPropertyValue<T>(
	object: T,
	path: string | string[],
	defaultValue: any,
): any {
	const pathArray = Array.isArray(path) ? path : path.split('.');

	let result: any = object;

	for (const key of pathArray) {
		if (result && key in result) {
			result = result[key];
		} else {
			return defaultValue;
		}
	}

	return result;
}

export async function fileToSerializedString(file: File): Promise<string> {
	const reader = new FileReader();
	reader.readAsDataURL(file);

	await new Promise<string>((resolve) => {
		reader.onload = (event: ProgressEvent<FileReader>) => {
			const fileContents = event.target?.result as string;
			resolve(fileContents);
		};

		reader.onerror = () => {
			resolve('');
		};
	});
	return reader.result as string;
}

// export Function to deserialize a string back to a File object
export function serializedStringToFile(data: string, fileName: string): File {
	const blob = dataURItoBlob(data);

	// You can create a File object from the Blob
	return new File([blob], fileName);
}

// Helper function to convert Data URI to Blob
export function dataURItoBlob(dataURI: string): Blob {
	if (isEmpty(dataURI)) return new Blob();
	const byteString = atob(dataURI.split(',')[1]);
	const ab = new ArrayBuffer(byteString.length);
	const ia = new Uint8Array(ab);
	for (let i = 0; i < byteString.length; i++) {
		ia[i] = byteString.charCodeAt(i);
	}

	return new Blob([ab], { type: 'application/octet-stream' });
}
export function getUrlWithoutQuery(url: string) {
	const queryIndex = url.indexOf('?');
	if (queryIndex !== -1) {
		return url.substring(0, queryIndex);
	}
	return url;
}
export function getTabIdFromUrl() {
	const searchParams = new URLSearchParams(window.location.search);
	return searchParams.get('tabId');
}

export function resetAfterVersionChange() {
	Object.entries(STATE_LIST).forEach(([name, store]) => {
		if (!VERSION_CHANGE_EXCEPTIONS.includes(name)) {
			store.getState()?.reset();
		}
	});
}

export function resetAfterOrgChange() {
	Object.entries(STATE_LIST).forEach(([name, store]) => {
		if (!ORG_CHANGE_EXCEPTIONS.includes(name)) {
			store.getState()?.reset();
		}
	});
	useApplicationStore.getState().reset();
}

export function addLibsToEditor(libs: Record<string, string>) {
	Object.entries(libs).forEach(([key, value]) => {
		globalThis.monaco?.languages.typescript.javascriptDefaults.addExtraLib(
			value as string,
			`file:///${key}`,
		);
	});
}

export function filterMatchingKeys(object1: any, object2: any) {
	for (const key2 in object2) {
		for (const key1 in object1) {
			if (key1.includes(key2)) {
				delete object2[key2];
				break;
			}
		}
	}

	return object2;
}

export function getTypeWorker() {
	return new Worker(new URL('../workers/fetchTypings.worker.ts', import.meta.url), {
		type: 'module',
	});
}

export function getVersionPermission(type: string): boolean {
	const version = useVersionStore.getState().version;
	const role = useApplicationStore.getState().application?.role;
	const user = useAuthStore.getState().user;

	const isPrivateForUser = version?.private ? user?._id === version.createdBy : true;

	const isVersionEditable = version?.readOnly
		? user?._id === version.createdBy || role === 'Admin'
		: isPrivateForUser && getAppPermission(type);

	return isVersionEditable as boolean;
}

export function isMobilePhone(phoneNumber: string): boolean {
	if (!phoneNumber.startsWith('+')) {
		return false;
	}
	for (const key in PHONE_REGEXES) {
		if (Object.prototype.hasOwnProperty.call(PHONE_REGEXES, key)) {
			const phone = PHONE_REGEXES[key as keyof typeof PHONE_REGEXES];
			if (phone.test(phoneNumber)) {
				return true;
			}
		}
	}
	return false;
}
export function stringifyObjectValues(obj: Record<string, any>): Record<string, string> {
	const stringifiedObj: Record<string, any> = {};

	for (const key in obj) {
		stringifiedObj[key] = String(obj[key]);
	}

	return stringifiedObj;
}

export async function formatCode(code: string) {
	try {
		return await prettier.format(code, {
			parser: 'babel',
			plugins: [jsParser, esTreePlugin],
			tabWidth: useAuthStore.getState().user?.editorSettings.tabSize ?? 3,
		});
	} catch (error) {
		return code;
	}
}
export function parseIfString(input: string | null) {
	if (input === '') {
		return null;
	}
	try {
		return JSON.parse(input as string);
	} catch (error) {
		return input;
	}
}
export const getValueFromData = (data: Record<string, unknown>, fieldName: string): any =>
	data[fieldName] ?? data[fieldName.toLowerCase()];

export function updateOrPush<T extends { _id: string }>(array: T[], newData: T) {
	const index = array.findIndex((item) => item._id === newData._id);

	if (index !== -1) {
		array[index] = { ...array[index], ...newData };
	} else {
		array.push(newData);
	}

	return array;
}
export function describeCronExpression(cronExpression: string) {
	try {
		return cronstrue.toString(cronExpression);
	} catch (error) {
		return 'Invalid cron expression';
	}
}

export function sortByField<T extends { updatedBy?: string; updatedAt: string; type: string }>(
	arr: T[] | undefined,
	field: keyof T,
	direction: 'asc' | 'desc' = 'asc',
): T[] {
	return _.orderBy(
		arr?.map((d) => ({
			...d,
			updatedAt: d?.updatedBy ? d.updatedAt : undefined,
			type: FIELD_MAPPER[d?.type] ?? d?.type,
		})),
		[field],
		[direction, 'asc'],
	);
}

export function isElementInViewport(el: Element) {
	const rect = el.getBoundingClientRect();
	return (
		rect.top >= 0 &&
		rect.left >= 0 &&
		rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
		rect.right <= (window.innerWidth || document.documentElement.clientWidth)
	);
}

export function isWithinParentBounds(el: Element, parent: Element) {
	const elRect = el.getBoundingClientRect();
	const parentRect = parent.getBoundingClientRect();

	return (
		elRect.top >= parentRect.top &&
		elRect.left >= parentRect.left &&
		elRect.bottom <= parentRect.bottom &&
		elRect.right <= parentRect.right
	);
}


export function getStatusClass(status: ContainerPipelineStatus) {
		switch (status) {
			case 'Succeeded':
				return 'text-elements-green';
			case 'Failed':
				return 'text-elements-red';
			case 'Running':
				return 'text-elements-yellow';
			case 'Error':
				return 'text-elements-red';
			case 'Started':
				return 'text-elements-blue';
			case 'Connected':
				return 'text-elements-blue';
			default:
				return 'text-default';
		}
	}