import useTabStore from '@/store/version/tabStore';
import useVersionStore from '@/store/version/versionStore';
import { useToast } from './useToast';

export default function useSaveLogicOnSuccess(title: string) {
	const { toast } = useToast();
	const { updateCurrentTab, getCurrentTab } = useTabStore();
	const { version } = useVersionStore();
	return function onSuccessSaveLogic() {
		updateCurrentTab(version._id, {
			...getCurrentTab(version._id),
			isDirty: false,
		});
		toast({
			title,
			action: 'success',
		});
	};
}
