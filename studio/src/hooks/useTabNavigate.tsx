import useTabStore from '@/store/version/tabStore';
import useVersionStore from '@/store/version/versionStore';
import { Tab } from '@/types';
import { generateId } from '@/utils';

export default function useTabNavigate() {
	const { getCurrentTab, addTab } = useTabStore();
	const { version } = useVersionStore();

	return (tab: Omit<Tab, 'id'>) => {
		const currentTab = getCurrentTab(version?._id as string);
		if (currentTab?.path === tab.path) return;
		if (currentTab) {
			addTab(version?._id as string, {
				...tab,
				id: generateId(),
			});
		}
	};
}
