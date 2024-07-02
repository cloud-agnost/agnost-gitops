import { AuthService, UserService } from "@/services";
import type {
  APIError,
  LoginParams,
  OrgAcceptInviteResponse,
  ProjectAcceptInviteResponse,
  User,
  UserDataToRegister,
} from "@/types";
import { joinChannel, leaveChannel } from "@/utils";
import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import useOrganizationStore from "../organization/organizationStore";
import useProjectStore from "../project/projectStore";

interface AuthState {
  accessToken: string | null | undefined;
  refreshToken: string | null | undefined;
  loading: boolean;
  error: APIError | undefined;
  user: User;
  email: string | undefined;
  isAccepted: boolean;
  isEditorSettingsDrawerOpen: boolean;
}

type Actions = {
  setUser: (user: User) => void;
  login: (req: LoginParams) => Promise<User>;
  logout: () => Promise<void>;
  setToken: (accessToken: string | null | undefined) => void;
  setRefreshToken: (refreshToken: string | null | undefined) => void;
  isAuthenticated: () => boolean;
  renewAccessToken: () => void;
  resetPassword: (email: string) => Promise<void>;
  verifyEmail: (email: string, code: number) => Promise<void>;
  changePasswordWithToken: ({
    token,
    newPassword,
  }: {
    token: string;
    newPassword: string;
  }) => Promise<null | APIError>;
  resendEmailVerificationCode: (email: string) => Promise<void>;
  initiateAccountSetup: (
    email: string,
    onSuccess: () => void,
    onError: (err: APIError) => void
  ) => Promise<void>;
  orgAcceptInvite: (
    req: UserDataToRegister
  ) => Promise<OrgAcceptInviteResponse>;
  orgAcceptInviteWithSession: (
    token: string
  ) => Promise<OrgAcceptInviteResponse>;
  projectAcceptInvite: (
    req: UserDataToRegister
  ) => Promise<ProjectAcceptInviteResponse>;
  projectAcceptInviteWithSession: (
    token: string
  ) => Promise<ProjectAcceptInviteResponse>;
  changeName: (name: string) => Promise<User>;
  changeEmail: (email: string, password: string) => Promise<string>;
  changeAvatar: (avatar: File) => Promise<User>;
  removeAvatar: () => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateNotifications: (notifications: string[]) => Promise<User>;
  confirmChangeLoginEmail: (token: string) => Promise<void>;
  getUser: () => Promise<User>;
  reset: () => void;
};

const initialState: AuthState = {
  accessToken: undefined,
  refreshToken: undefined,
  loading: false,
  error: undefined,
  user: {} as User,
  email: undefined,
  isAccepted: false,
  isEditorSettingsDrawerOpen: false,
};

const useAuthStore = create<AuthState & Actions>()(
  subscribeWithSelector(
    devtools(
      persist(
        (set, get) => ({
          ...initialState,
          setUser: (user) => {
            set({ user });
            if (user) joinChannel(user._id);
            if (user?.at) get().setToken(user.at);
            if (user?.rt) get().setRefreshToken(user.rt);
          },
          login: async (req: LoginParams) => {
            try {
              const user = await AuthService.login(req);
              get().setUser(user);

              return user;
            } catch (error) {
              set({ error: error as APIError });
              throw error;
            }
          },
          logout: async () => {
            try {
              const user = get().user;
              if (user) leaveChannel(user?._id);
              await AuthService.logout();
              set(initialState);
              leaveChannel("cluster");
            } catch (error) {
              set({ error: error as APIError });
              throw error;
            }
          },
          setToken: (accessToken) => set({ accessToken }),
          setRefreshToken: (refreshToken) => set({ refreshToken }),
          isAuthenticated: () => Boolean(get().accessToken),
          renewAccessToken: async () => {
            if (!get().isAuthenticated()) return;
            const res = await AuthService.renewAccessToken();
            get().setRefreshToken(res.rt);
            get().setToken(res.at);
          },

          resetPassword(email) {
            return UserService.resetPassword({
              email,
              uiBaseURL: window.location.origin,
            });
          },
          async verifyEmail(email: string, code: number) {
            try {
              const user = await AuthService.validateEmail(email, code);
              get().setUser(user);
              return user;
            } catch (error) {
              throw error as APIError;
            }
          },
          changePasswordWithToken({ token, newPassword }) {
            return UserService.changePasswordWithToken({
              token,
              newPassword,
            });
          },
          async resendEmailVerificationCode(email: string) {
            await AuthService.resendEmailVerificationCode(email);
          },
          async initiateAccountSetup(
            email: string,
            onSuccess: () => void,
            onError: (err: APIError) => void
          ) {
            try {
              await AuthService.initiateAccountSetup(email);
              set({ email });
              onSuccess();
            } catch (error) {
              onError(error as APIError);
            }
          },
          async orgAcceptInvite(req: UserDataToRegister) {
            try {
              const res = await UserService.orgAcceptInvite(req);
              get().setUser(res.user);
              joinChannel(res.org._id);
              if (get().isAuthenticated()) {
                useOrganizationStore.setState?.((state) => ({
                  organizations: [...state.organizations, res.org],
                }));
              }
              return res;
            } catch (err) {
              set({ error: err as APIError });
              throw err;
            }
          },
          async orgAcceptInviteWithSession(token: string) {
            try {
              const res = await UserService.orgAcceptInviteWithSession(token);
              get().setUser(res.user);
              joinChannel(res.org._id);
              if (get().isAuthenticated()) {
                useOrganizationStore.setState?.((state) => ({
                  organizations: [...state.organizations, res.org],
                }));
              }
              return res;
            } catch (err) {
              set({ error: err as APIError });
              throw err;
            }
          },
          async projectAcceptInvite(req: UserDataToRegister) {
            try {
              const res = await UserService.projectAcceptInvite(req);
              get().setUser(res.user);
              joinChannel(res.org._id);
              if (get().isAuthenticated()) {
                useProjectStore.setState?.((state) => ({
                  projects: [...state.projects, res.project],
                }));
              }
              return res;
            } catch (err) {
              set({ error: err as APIError });
              throw err;
            }
          },
          async projectAcceptInviteWithSession(token: string) {
            try {
              const res = await UserService.projectAcceptInviteWithSession(
                token
              );
              get().setUser(res.user);
              joinChannel(res.org._id);
              if (get().isAuthenticated()) {
                useProjectStore.setState?.((state) => ({
                  projects: [...state.projects, res.project],
                }));
              }
              return res;
            } catch (err) {
              set({ error: err as APIError });
              throw err;
            }
          },
          async changeName(name: string) {
            const user = await UserService.changeName(name);
            set({ user });
            return user;
          },
          async changeEmail(email: string, password) {
            const newEmail = await UserService.changeEmail({
              email,
              password,
              uiBaseURL: window.location.origin,
            });
            return newEmail;
          },
          async changeAvatar(avatar: File) {
            const user = await UserService.changeAvatar(avatar);
            set({ user });
            return user;
          },
          async removeAvatar() {
            try {
              const user = await UserService.removeAvatar();
              set({ user });
            } catch (err) {
              set({ error: err as APIError });
              throw err;
            }
          },
          async changePassword(currentPassword: string, newPassword: string) {
            return UserService.changePassword(currentPassword, newPassword);
          },
          async deleteAccount() {
            return UserService.deleteAccount();
          },
          async updateNotifications(notifications: string[]) {
            const res = await UserService.updateNotifications({
              notifications,
            });
            set({ user: res });
            return res;
          },
          confirmChangeLoginEmail(token: string) {
            try {
              return UserService.confirmChangeLoginEmail(token);
            } catch (error) {
              throw error as APIError;
            }
          },
          async getUser() {
            const user = await UserService.getUser();
            get().setUser(user);
            return user;
          },
          reset() {
            set(initialState);
          },
        }),
        {
          name: "auth-store",
        }
      ),
      {
        name: "auth",
      }
    )
  )
);

export default useAuthStore;
