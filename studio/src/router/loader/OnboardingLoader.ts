import useAuthStore from "@/store/auth/authStore";
import useClusterStore from "@/store/cluster/clusterStore";
import { redirect } from "react-router-dom";

async function accountInformationLoader() {
  //TODO resetAllStores();
  return {};
}
async function onboardingLoader() {
  const status = await useClusterStore.getState().checkClusterSetup();
  const isAuthenticated = useAuthStore.getState().isAuthenticated();

  if (status) {
    return redirect(isAuthenticated ? "/organization" : "/login");
  }

  return null;
}

export default {
  accountInformationLoader,
  onboardingLoader,
};
