import useAuthStore from "@/store/auth/authStore";
import useOrganizationStore from "@/store/organization/organizationStore";
import { resetAfterOrgChange } from "@/utils";
import { LoaderFunctionArgs, redirect } from "react-router-dom";

const REDIRECT_URLS = {
  "project-invite": "/project-accept?token=:token",
  "org-invite": "/org-accept?token=:token",
};

function homeLoader() {
  if (useAuthStore.getState().isAuthenticated()) {
    return redirect("/organization");
  } else return redirect("/login");
}

function redirectHandleLoader(params: LoaderFunctionArgs) {
  const url = new URL(params.request.url);
  const token = url.searchParams.get("token");
  const type = url.searchParams.get("type");

  if (!type || !token) {
    return redirect("/login");
  }

  return redirect(
    REDIRECT_URLS[type as keyof typeof REDIRECT_URLS].replace(":token", token)
  );
}

function organizationSelectLoader() {
  resetAfterOrgChange();
  useOrganizationStore.getState().reset();
  return null;
}

function clusterManagementLoader() {
  const user = useAuthStore.getState().user;

  if (!user.isClusterOwner) {
    return redirect("/401");
  }

  return null;
}

export default {
  homeLoader,
  redirectHandleLoader,
  organizationSelectLoader,
  clusterManagementLoader,
};
