import { axios } from '@/helpers';
import {
	ClusterSetupResponse,
	CompleteAccountSetupRequest,
	FinalizeAccountSetupRequest,
	OnboardingData,
	User,
	UserDataToRegister,
} from '@/types';

export default class AuthService {
	static url = '/v1/auth';

	static async initializeClusterSetup(data: UserDataToRegister): Promise<User> {
		return (await axios.post(`${this.url}/init-cluster-setup`, data)).data;
	}
	static async finalizeClusterSetup(req: OnboardingData): Promise<ClusterSetupResponse> {
		return (await axios.post(`${this.url}/finalize-cluster-setup`, req)).data;
	}

	static async resendEmailVerificationCode(email: string) {
		return (await axios.post(`${this.url}/resend-code`, { email })).data;
	}

	static async initiateAccountSetup(email: string) {
		return (await axios.post(`${this.url}/init-account-setup`, { email })).data;
	}

	static async finalizeAccountSetup(data: FinalizeAccountSetupRequest): Promise<User> {
		return (await axios.post(`${this.url}/finalize-account-setup`, data)).data;
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

	static async login(email: string, password: string): Promise<User> {
		return (
			await axios.post(`${this.url}/login`, {
				email,
				password,
			})
		).data;
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

	static async completeAccountSetup(data: CompleteAccountSetupRequest): Promise<User> {
		return (await axios.post(`${this.url}/complete-setup`, data)).data;
	}
}
