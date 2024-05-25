import { ERROR_CODES_TO_REDIRECT_LOGIN_PAGE } from '@/constants';
import useAuthStore from '@/store/auth/authStore.ts';
import useTabStore from '@/store/version/tabStore';
import useVersionStore from '@/store/version/versionStore';
import { APIError } from '@/types';
import { history, toDisplayName } from '@/utils';
import axios from 'axios';
import { resetAllStores } from '.';
const baseURL = `${window.location.protocol}//${window.location.hostname}`;

const headers = {
	'Content-Type': 'application/json',
};
export const instance = axios.create({
	baseURL: `${baseURL}/api`,
	headers,
});

export const envInstance = axios.create({
	headers,
	baseURL,
});

export const testEndpointInstance = axios.create({
	headers,
	baseURL,
});

instance.interceptors.request.use((config) => {
	const accessToken = useAuthStore.getState().accessToken;
	const refreshToken = useAuthStore.getState().refreshToken;
	if (accessToken) {
		config.headers['Authorization'] = accessToken;
	}
	if (refreshToken) {
		config.headers['Refresh-Token'] = refreshToken;
	}
	return config;
});

instance.interceptors.response.use(
	(response) => {
		const at = response.headers['access-token'];
		const rt = response.headers['refresh-token'];
		if (at && rt) {
			useAuthStore.getState().setRefreshToken(rt);
			useAuthStore.getState().setToken(at);
		}
		return response;
	},
	(error) => {
		const err = error.response.data as APIError;
		const apiError = {
			...err,
			details: err.fields?.[0]?.msg ?? err.details,
		};
		if (ERROR_CODES_TO_REDIRECT_LOGIN_PAGE.includes(apiError.code)) {
			resetAllStores();
			history.navigate?.('/login');
		}

		if (apiError.code === 'not_found' && error.config.url.includes('version')) {
			const { getVersionDashboardPath, version } = useVersionStore.getState();
			const path = getVersionDashboardPath('notFound');
			useTabStore.getState().updateCurrentTab(version._id, {
				path,
			});
			history.navigate?.(path);
		}

		return Promise.reject(apiError);
	},
);

envInstance.interceptors.request.use((config) => {
	const accessToken = useAuthStore.getState().accessToken;
	const refreshToken = useAuthStore.getState().refreshToken;
	if (accessToken) {
		config.headers['Authorization'] = accessToken;
	}
	if (refreshToken) {
		config.headers['Refresh-Token'] = refreshToken;
	}
	return config;
});

envInstance.interceptors.response.use(
	(response) => {
		const at = response.headers['access-token'];
		const rt = response.headers['refresh-token'];
		if (at && rt) {
			useAuthStore.getState().setRefreshToken(rt);
			useAuthStore.getState().setToken(at);
		}
		return response;
	},
	({ response: { data } }) => {
		const err: APIError = {
			code: data.code ?? data.errors[0].code,
			error:
				data.error ??
				data.errors[0].error ??
				data.errors?.[0]?.specifics?.[0].code ??
				toDisplayName(data.errors?.[0]?.code),
			details: data.message ?? data.errors[0].message ?? data.errors.fields?.[0]?.msg,
		};
		return Promise.reject(err);
	},
);
testEndpointInstance.interceptors.response.use(
	(response) => {
		return response;
	},
	(error) => {
		return error.response;
	},
);
