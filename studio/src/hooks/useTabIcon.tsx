import { TAB_ICON_MAP } from '@/constants';
import { TabTypes } from '@/types';
import { cn } from '@/utils';

export default function useTabIcon(className: string) {
	const color: Record<TabTypes, string> = {
		[TabTypes.Bucket]: 'text-storage',
		[TabTypes.Cache]: 'text-cache',
		[TabTypes.Dashboard]: 'text-dashboard',
		[TabTypes.Function]: 'text-function',
		[TabTypes.Middleware]: 'text-middleware',
		[TabTypes.Database]: 'text-database',
		[TabTypes.MessageQueue]: 'text-queue',
		[TabTypes.Task]: 'text-task',
		[TabTypes.Endpoint]: 'text-endpoint',
		[TabTypes.File]: 'text-storage',
		[TabTypes.Field]: 'text-database',
		[TabTypes.Model]: 'text-database',
		[TabTypes.Navigator]: 'text-database',
		[TabTypes.Storage]: 'text-storage',
		[TabTypes.Settings]: 'text-settings',
		[TabTypes.Notifications]: 'text-notification',
		[TabTypes.APIKeys]: '',
		[TabTypes.Authentication]: '',
		[TabTypes.CustomDomains]: '',
		[TabTypes.Environment]: '',
		[TabTypes.EnvironmentVariables]: '',
		[TabTypes.NPMPackages]: '',
		[TabTypes.RateLimits]: '',
		[TabTypes.Realtime]: '',
		[TabTypes.Container]: 'text-cache',
	};
	function getTabIcon(type: TabTypes) {
		const Icon = TAB_ICON_MAP[type];
		return <Icon className={cn(`${color[type]}`, className)} />;
	}

	return getTabIcon;
}
