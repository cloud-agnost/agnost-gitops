import { axios } from '@/helpers';
import { Types } from '@/types/type';

export default class TypesService {
	static url = '/v1/types';

	static async getAllTypes(): Promise<Types> {
		return (await axios.get(`${this.url}/all`)).data;
	}
}
