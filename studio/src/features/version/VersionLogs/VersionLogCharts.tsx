import { Button } from '@/components/Button';
import useAuthStore from '@/store/auth/authStore';
import useThemeStore from '@/store/theme/themeStore';
import useTabStore from '@/store/version/tabStore';
import useUtilsStore from '@/store/version/utilsStore';
import useVersionStore from '@/store/version/versionStore';
import { ConditionsType, Filters } from '@/types';
import { DATE_TIME_FORMAT, formatDate } from '@/utils';
import { ArrowClockwise } from '@phosphor-icons/react';
import { differenceInSeconds, endOfDay, startOfDay } from 'date-fns';
import { t } from 'i18next';
import _ from 'lodash';
import { useMemo } from 'react';
import { Range } from 'react-date-range';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { CustomTooltip } from './VersionLogs';

interface VersionLogChartsProps {
	type: 'queue' | 'task' | 'endpoint';
	refetch: () => void;
}

export default function VersionLogCharts({ type, refetch }: VersionLogChartsProps) {
	const userId = useAuthStore((state) => state.user?._id);
	const version = useVersionStore((state) => state.version);

	const [searchParams, setSearchParams] = useSearchParams();
	const updateCurrentTab = useTabStore((state) => state.updateCurrentTab);
	const { pathname } = useLocation();
	const { columnFilters, clearLogColumnFilter, setColumnFilters } = useUtilsStore();
	function selectDate(date: Range[]) {
		setColumnFilters(
			'timestamp',
			{
				conditions: [
					{
						filter: date[0].startDate?.toISOString() ?? '',
						type: ConditionsType.GreaterThanOrEqual,
					},
					{
						filter: date[0].endDate?.toISOString() ?? '',
						type: ConditionsType.LessThanOrEqual,
					},
				],
				filterType: Filters.Date,
			},
			type,
		);
		searchParams.set('start', (date[0].startDate as Date).toISOString() ?? '');
		searchParams.set('end', (date[0].endDate as Date).toISOString() ?? '');
		setSearchParams(searchParams);
		updateCurrentTab(version._id, {
			path: `${pathname}?${searchParams.toString()}`,
		});
	}
	const handleClickChart = (e: any) => {
		if (e?.activeLabel && e?.activeTooltipIndex !== undefined) {
			const currentData = data[e.activeTooltipIndex];
			const diff = differenceInSeconds(new Date(currentData.end), new Date(currentData.start));
			if (diff > 10)
				if (currentData?.success) {
					selectDate([
						{
							startDate: new Date(currentData.start),
							endDate: new Date(currentData.end),
							key: 'selection',
						},
					]);
				}
		}
	};

	const { getTheme } = useThemeStore();
	const { logBuckets } = useVersionStore();
	const data = useMemo(
		() =>
			logBuckets?.[type]?.buckets?.map?.((item) => ({
				name: `${formatDate(item.end, DATE_TIME_FORMAT)}`,
				tooltip: `${formatDate(item.start, DATE_TIME_FORMAT)} - ${formatDate(
					item.end,
					DATE_TIME_FORMAT,
				)}`,
				start: formatDate(item.start, DATE_TIME_FORMAT),
				end: formatDate(item.end, DATE_TIME_FORMAT),
				success: item.success,
				error: item?.error,
			})) ?? [],
		[logBuckets?.[type]],
	);

	function clearFilters() {
		clearLogColumnFilter(type);
		searchParams.set('start', startOfDay(new Date()).toISOString() ?? '');
		searchParams.set('end', endOfDay(new Date()).toISOString() ?? '');
		setSearchParams(searchParams);
		updateCurrentTab(version._id, {
			path: `${pathname}?${searchParams.toString()}`,
		});
	}

	return (
		<div className='max-h-[400px] border border-border rounded-lg'>
			<div className='flex items-center justify-between bg-subtle w-full rounded-t-lg p-4'>
				<div>
					<h1 className='text-default space-x-1 text-sm'>
						<span>{logBuckets?.[type]?.totalHits}</span>
						{logBuckets && (
							<span>{logBuckets[type]?.totalHits <= 1 ? t('version.hit') : t('version.hits')}</span>
						)}
					</h1>
					<p className='text-xs text-subtle'>
						{formatDate(searchParams.get('start') as string, DATE_TIME_FORMAT)} to{' '}
						{formatDate(searchParams.get('end') as string, DATE_TIME_FORMAT)}
					</p>
				</div>
				<div className='space-x-4'>
					{!_.isEmpty(columnFilters?.[type]) && (
						<Button variant='outline' onClick={clearFilters}>
							Clear Filters
						</Button>
					)}
					<Button variant='outline' onClick={() => refetch()} iconOnly>
						<ArrowClockwise className='mr-1 text-sm' />
						{t('general.refresh')}
					</Button>
				</div>
			</div>
			<div className='p-4 w-full max-h-1/2'>
				<ResponsiveContainer width='100%' height='100%' minHeight={250}>
					<BarChart
						data={data}
						margin={{
							top: 20,
							right: 30,
							left: 0,
							bottom: 5,
						}}
						onClick={handleClickChart}
					>
						<XAxis minTickGap={10} dataKey='name' />
						<Tooltip
							content={<CustomTooltip payload={data} />}
							cursor={{
								fill:
									getTheme(userId as string) === 'dark'
										? 'rgba(255,255,255,0.1)'
										: 'rgba(0,0,0,0.1)',
								radius: 2,
							}}
						/>
						<Bar name='Success' dataKey='success' stackId='a' fill='#11BB69' />
						<Bar
							name='Error'
							dataKey='error'
							stackId='a'
							fill='#EE446D'
							radius={[4, 4, 0, 0]}
							className='text-default'
						/>
					</BarChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}
