import { axios } from '@/helpers';
import { SMTPSettings } from '@/types/type.ts';

export default class PlatformService {
	static url = '/v1/platform';
	static async testSMTPSettings(data: SMTPSettings) {
		return (await axios.post(`${this.url}/test/smtp`, data)).data;
	}
}
