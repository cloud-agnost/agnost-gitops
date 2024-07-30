import { axios } from "@/helpers";
import {
  BaseGetRequest,
  OrgAcceptInviteResponse,
  ProjectAcceptInviteResponse,
  UpdateNotificationData,
  User,
  UserDataToRegister,
} from "@/types/type.ts";
export default class UserService {
  static url = "/v1/user";

  static async getUser(): Promise<User> {
    return (await axios.get(`${this.url}/me`)).data;
  }

  static async resetPassword({
    email,
    uiBaseURL,
  }: {
    email: string;
    uiBaseURL: string;
  }) {
    return (await axios.post(`${this.url}/reset-pwd`, { email, uiBaseURL }))
      .data;
  }

  static async changePasswordWithToken({
    newPassword,
    token,
  }: {
    newPassword: string;
    token: string;
  }) {
    return (await axios.post(`${this.url}/reset-pwd/${token}`, { newPassword }))
      .data;
  }

  static async appAcceptInvite(token: string) {
    return (
      await axios.post(`${this.url}/app-invite-accept?token=${token}`, {
        token,
      })
    ).data;
  }
  static async orgAcceptInviteWithSession(
    token: string
  ): Promise<OrgAcceptInviteResponse> {
    return (
      await axios.post(`${this.url}/org-invite-accept-session?token=${token}`, {
        token,
      })
    ).data;
  }
  static async orgAcceptInvite(
    req: UserDataToRegister
  ): Promise<OrgAcceptInviteResponse> {
    return (
      await axios.post(
        `${this.url}/org-invite-accept`,
        {},
        {
          params: req,
        }
      )
    ).data;
  }
  static async projectAcceptInvite(
    req: UserDataToRegister
  ): Promise<ProjectAcceptInviteResponse> {
    return (
      await axios.post(
        `${this.url}/project-invite-accept`,
        {},
        {
          params: req,
        }
      )
    ).data;
  }
  static async projectAcceptInviteWithSession(
    token: string
  ): Promise<ProjectAcceptInviteResponse> {
    return (
      await axios.post(
        `${this.url}/project-invite-accept-session?token=${token}`,
        {
          token,
        }
      )
    ).data;
  }

  static async changeName(name: string): Promise<User> {
    return (await axios.put(`${this.url}/name`, { name })).data;
  }

  static async changeEmail(data: {
    email: string;
    password: string;
    uiBaseURL: string;
  }): Promise<string> {
    return (await axios.post(`${this.url}/login-email`, data)).data;
  }

  static async confirmChangeLoginEmail(token: string): Promise<void> {
    return (await axios.post(`${this.url}/login-email/${token}`, {})).data;
  }

  static async changeAvatar(avatar: File): Promise<User> {
    const formData = new FormData();
    formData.append("picture", avatar, avatar.name);
    return (
      await axios.put(`${this.url}/picture`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
    ).data;
  }

  static async removeAvatar(): Promise<User> {
    return (await axios.delete(`${this.url}/picture`)).data;
  }

  static async changePassword(currentPassword: string, newPassword: string) {
    return (
      await axios.put(`${this.url}/password`, {
        password: currentPassword,
        newPassword,
      })
    ).data;
  }

  static async deleteAccount() {
    return (await axios.delete(`${this.url}`)).data;
  }

  static async updateNotifications(
    data: UpdateNotificationData
  ): Promise<User> {
    return (await axios.put(`${this.url}/notifications`, data)).data;
  }

  static async getActiveUsers(params: BaseGetRequest): Promise<User[]> {
    return (await axios.get(`${this.url}/list`, { params })).data;
  }
}
