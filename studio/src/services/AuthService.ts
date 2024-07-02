import { axios } from "@/helpers";
import {
  ClusterSetupResponse,
  LoginParams,
  OnboardingData,
  User,
  UserDataToRegister,
} from "@/types";

export default class AuthService {
  static url = "/v1/auth";

  static async initializeClusterSetup(data: UserDataToRegister): Promise<User> {
    return (await axios.post(`${this.url}/setup/start`, data)).data;
  }
  static async finalizeClusterSetup(
    req: OnboardingData
  ): Promise<ClusterSetupResponse> {
    return (await axios.post(`${this.url}/setup/end`, req)).data;
  }

  static async resendEmailVerificationCode(email: string) {
    return (await axios.post(`${this.url}/resend-code`, { email })).data;
  }

  static async initiateAccountSetup(email: string) {
    return (await axios.post(`${this.url}/init-account-setup`, { email })).data;
  }

  static async completeAccountSetupFollowingInviteAccept(data: {
    email: string;
    token: string;
    inviteType: string;
    name: string;
    password: string;
  }) {
    return (await axios.post(`${this.url}/complete-setup`, data)).data;
  }

  static async login(req: LoginParams): Promise<User> {
    return (await axios.post(`${this.url}/login`, req)).data;
  }

  static async validateEmail(email: string, code: number) {
    return (
      await axios.post(`${this.url}/validate-email`, {
        email,
        code,
      })
    ).data;
  }

  static async logout(): Promise<void> {
    return (await axios.post(`${this.url}/logout`)).data;
  }

  static async renewAccessToken(): Promise<{ at: string; rt: string }> {
    return (await axios.post(`${this.url}/renew`)).data;
  }
}
