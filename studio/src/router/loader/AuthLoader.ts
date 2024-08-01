import useAuthStore from "@/store/auth/authStore";
import useClusterStore from "@/store/cluster/clusterStore";
import useContainerStore from "@/store/container/containerStore";
import { resetAllStores } from "@/utils";
import { LoaderFunctionArgs, redirect } from "react-router-dom";

async function registerLoader({ request }: LoaderFunctionArgs) {
  const accessToken = new URL(request.url).searchParams.get("access_token");
  const status = new URL(request.url).searchParams.get("status");
  const error = new URL(request.url).searchParams.get("error");

  if (status === "200" && accessToken && !error) {
    try {
      await useClusterStore.getState().initializeClusterSetup({
        accessToken,
        provider: new URL(request.url).searchParams.get("provider") as
          | "github"
          | "gitlab"
          | "bitbucket",
        expiresAt: new URL(request.url).searchParams.get(
          "expires_at"
        ) as string,
        refreshToken: new URL(request.url).searchParams.get(
          "refresh_token"
        ) as string,
      });
      return redirect("/register/setup");
    } catch (error) {
      return error;
    }
  }
  return status;
}

async function loginLoader({ request }: LoaderFunctionArgs) {
  const accessToken = new URL(request.url).searchParams.get("access_token");
  const status = new URL(request.url).searchParams.get("status");
  const error = new URL(request.url).searchParams.get("error");
  resetAllStores();
  if (status === "200" && accessToken && !error) {
    try {
      await useAuthStore.getState().login({
        accessToken,
        provider: new URL(request.url).searchParams.get("provider") as
          | "github"
          | "gitlab"
          | "bitbucket",
        expiresAt: new URL(request.url).searchParams.get(
          "expires_at"
        ) as string,
        refreshToken: new URL(request.url).searchParams.get(
          "refresh_token"
        ) as string,
      });
      await useContainerStore.getState().addGitProvider({
        accessToken,
        provider: new URL(request.url).searchParams.get("provider") as
          | "github"
          | "gitlab"
          | "bitbucket",
        expiresAt: new URL(request.url).searchParams.get(
          "expires_at"
        ) as string,
        refreshToken: new URL(request.url).searchParams.get(
          "refresh_token"
        ) as string,
      });
      return redirect("/organization");
    } catch (error) {
      return error;
    }
  }
  return status;
}
async function orgAcceptInvitation({ request }: LoaderFunctionArgs) {
  const accessToken = new URL(request.url).searchParams.get("access_token");
  const status = new URL(request.url).searchParams.get("status");
  const error = new URL(request.url).searchParams.get("error");
  const token = new URL(request.url).searchParams.get("token");
  const isAuthenticated = useAuthStore.getState().isAuthenticated();

  if (isAuthenticated) {
    useAuthStore.getState().orgAcceptInviteWithSession(token as string);
    return redirect("/organization");
  }

  if (status === "200" && accessToken && !error) {
    try {
      await useAuthStore.getState().orgAcceptInvite({
        token: token as string,
        accessToken,
        provider: localStorage.getItem("provider") as
          | "github"
          | "gitlab"
          | "bitbucket",
        expiresAt: new URL(request.url).searchParams.get(
          "expires_at"
        ) as string,
        refreshToken: new URL(request.url).searchParams.get(
          "refresh_token"
        ) as string,
      });
      localStorage.removeItem("provider");
      return redirect("/organization");
    } catch (error) {
      return error;
    }
  }
  return token;
}
async function projectAcceptInvite({ request }: LoaderFunctionArgs) {
  const accessToken = new URL(request.url).searchParams.get("access_token");
  const status = new URL(request.url).searchParams.get("status");
  const error = new URL(request.url).searchParams.get("error");
  const token = new URL(request.url).searchParams.get("token");
  const isAuthenticated = useAuthStore.getState().isAuthenticated();

  if (isAuthenticated) {
    useAuthStore.getState().projectAcceptInviteWithSession(token as string);
    return redirect("/organization");
  }

  if (status === "200" && accessToken && !error) {
    try {
      await useAuthStore.getState().projectAcceptInvite({
        token: token as string,
        accessToken,
        provider: localStorage.getItem("provider") as
          | "github"
          | "gitlab"
          | "bitbucket",
        expiresAt: new URL(request.url).searchParams.get(
          "expires_at"
        ) as string,
        refreshToken: new URL(request.url).searchParams.get(
          "refresh_token"
        ) as string,
      });
      return redirect("/organization");
    } catch (error) {
      return error;
    }
  }
  return token;
}

export default {
  registerLoader,
  loginLoader,
  orgAcceptInvitation,
  projectAcceptInvite,
};
