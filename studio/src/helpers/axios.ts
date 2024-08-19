import { ERROR_CODES_TO_REDIRECT_LOGIN_PAGE } from "@/constants";
import useAuthStore from "@/store/auth/authStore.ts";
import { APIError } from "@/types";
import { resetAllStores, toDisplayName } from "@/utils";
import axios from "axios";

const baseURL = `${window.location.protocol}//${window.location.hostname}`;

const headers = {
  "Content-Type": "application/json",
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
    config.headers["Authorization"] = accessToken;
  }
  if (refreshToken) {
    config.headers["Refresh-Token"] = refreshToken;
  }
  return config;
});

instance.interceptors.response.use(
  (response) => {
    const at = response.headers["access-token"];
    const rt = response.headers["refresh-token"];
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
      window.location.href = "/studio/login";
      resetAllStores();
    }

    return Promise.reject(apiError);
  }
);

envInstance.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  const refreshToken = useAuthStore.getState().refreshToken;
  if (accessToken) {
    config.headers["Authorization"] = accessToken;
  }
  if (refreshToken) {
    config.headers["Refresh-Token"] = refreshToken;
  }
  return config;
});

envInstance.interceptors.response.use(
  (response) => {
    const at = response.headers["access-token"];
    const rt = response.headers["refresh-token"];
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
      details:
        data.message ?? data.errors[0].message ?? data.errors.fields?.[0]?.msg,
    };
    return Promise.reject(err);
  }
);
testEndpointInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return error.response;
  }
);
