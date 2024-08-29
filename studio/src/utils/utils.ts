import { ORG_CHANGE_EXCEPTIONS } from '@/constants';
import { STATE_LIST } from '@/constants/stateList';
import { socket } from '@/helpers';
import { toast } from '@/hooks/useToast';
import useAuthStore from '@/store/auth/authStore';
import useContainerStore from '@/store/container/containerStore';
import useEnvironmentStore from '@/store/environment/environmentStore';
import useOrganizationStore from '@/store/organization/organizationStore';
import useProjectStore from '@/store/project/projectStore';
import { CustomDomainSchema, ProjectRole, RealtimeData } from '@/types';
import { clsx, type ClassValue } from 'clsx';
import copy from 'copy-to-clipboard';
import cronstrue from 'cronstrue';
import i18next from 'i18next';
import _, { capitalize } from 'lodash';
import psl from 'psl';
import { twMerge } from 'tailwind-merge';

export function arrayToQueryString(array: string[] | undefined, key: string) {
	return array?.map((item) => `${key}=${item}`).join('&');
}

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

export function onChannelMessage<T>(channel: string, callback: (data: RealtimeData<T>) => void) {
	socket.on(channel, callback);
	return () => {
		socket.off(channel);
	};
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

export function toDisplayName(name: string) {
	return name.replace(/[-_]/g, ' ').split(' ').map(capitalize).join(' ');
}

export const getProjectPermission = (path: string, role?: ProjectRole): boolean => {
	const { projectAuthorization, project } = useProjectStore.getState();
	const key = `${project?.role ?? role}.project.${path}`;
	return _.get(projectAuthorization, key);
};

export const getOrgPermission = (path: string): boolean => {
	const role = useOrganizationStore.getState().organization.role;
	return _.get(useOrganizationStore.getState().orgAuthorization?.[role]?.org, path);
};

export function resetAfterOrgChange() {
	Object.entries(STATE_LIST).forEach(([name, store]) => {
		if (!ORG_CHANGE_EXCEPTIONS.includes(name)) {
			store.getState()?.reset();
		}
	});
}

export function resetAfterProjectChange() {
	useContainerStore.getState().reset();
	useEnvironmentStore.getState().reset();
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
	const FIELD_MAPPER: Record<string, string> = {
		createdat: 'datetime',
		updatedat: 'datetime',
		parent: 'reference',
	};
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

export const resetAllStores = () => {
	Object.entries(STATE_LIST).forEach(([, store]) => {
		store?.getState()?.reset?.();
	});
	useAuthStore.getState().reset();
};
export function isIPAddress(text: string): boolean {
	const ipv4Regex =
		/^(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)$/;
	const ipv6Regex = /^(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$/;

	return ipv4Regex.test(text) || ipv6Regex.test(text);
}
export function isWildcardDomain(domain: string): boolean {
	const wildcardRegex = /^\*\./;
	return wildcardRegex.test(domain);
}

export function isRootDomain(domain: string) {
	try {
		if (domain && domain.trim().startsWith('*.')) return false;
		CustomDomainSchema.parse({ domain });
		const parsedDomain = psl.parse(domain);
		//@ts-ignore
		if (parsedDomain && parsedDomain.domain === domain) {
			return true;
		}
		return false;
	} catch (error) {
		return false;
	}
}
