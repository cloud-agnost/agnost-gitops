import useUtilsStore from '@/store/version/utilsStore';
import { RealtimeActionParams } from '@/types';
import { addLibsToEditor } from '@/utils';

class Typings {
	update({ data }: RealtimeActionParams<Record<string, string>>) {
		addLibsToEditor(data);
		useUtilsStore.setState((prev) => ({
			...prev,
			typings: {
				...(prev?.typings as Record<string, string>),
				...data,
			},
		}));
	}
}

export default Typings;
