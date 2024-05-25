import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { DateRangePicker } from '@/components/DateRangePicker';
import { BASE_URL_WITH_API, NOTIFICATION_ACTIONS } from '@/constants';
import { useUpdateEffect } from '@/hooks';
import useApplicationStore from '@/store/app/applicationStore';
import { ApplicationMember, FormatOptionLabelProps } from '@/types';
import { capitalize } from '@/utils';
import { endOfDay, startOfDay } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { Range } from 'react-date-range';
import { useParams, useSearchParams } from 'react-router-dom';
import Select from 'react-select';

const formatOptionLabel = ({ label, value }: FormatOptionLabelProps<ApplicationMember>) => {
	const name = label?.split(' ');
	return (
		<div className='gap-2 flex items-center'>
			{value?.member.pictureUrl ? (
				<img
					src={`${BASE_URL_WITH_API}/${value?.member.pictureUrl}`}
					alt={label}
					className='rounded-full object-contain w-6 h-6'
				/>
			) : (
				name && (
					<div
						className='relative inline-flex items-center justify-center cursor-pointer overflow-hidden w-6 h-6 rounded-full'
						style={{
							backgroundColor: value?.member.color,
						}}
					>
						<span className='text-default text-xs'>
							{name[0]?.charAt(0).toUpperCase()}
							{name[1]?.charAt(0).toUpperCase()}
						</span>
					</div>
				)
			)}
			<span className='ml-2 text-default text-xs'>{label}</span>
		</div>
	);
};

export default function NotificationFilter() {
	const [searchParams, setSearchParams] = useSearchParams();
	const { orgId, appId } = useParams() as Record<string, string>;
	const { getAppTeamMembers, tempTeam: members } = useApplicationStore();

	const [date, setDate] = useState<Range[]>([
		{
			startDate: startOfDay(new Date()),
			endDate: endOfDay(new Date()),
			key: 'selection',
		},
	]);

	function addNewParam(key: string, value: string) {
		searchParams.set(key, searchParams.get(key) ? `${searchParams.get(key)},${value}` : value);
		setSearchParams(searchParams);
	}

	function removeParam(key: string, value: string) {
		const values = searchParams.get(key)?.split(',') ?? [];
		const newValues = values.filter((v) => v !== value);
		if (newValues.length) {
			searchParams.set(key, newValues.join(','));
		} else {
			searchParams.delete(key);
		}
		setSearchParams(searchParams);
	}

	function resetDateFilter() {
		searchParams.delete('start');
		searchParams.delete('end');
		setSearchParams(searchParams);
		setDate([
			{
				startDate: startOfDay(new Date()),
				endDate: endOfDay(new Date()),
				key: 'selection',
			},
		]);
	}

	function resetActionFilter() {
		searchParams.delete('a');
		setSearchParams(searchParams);
	}

	function clearAllFilters() {
		resetDateFilter();
		resetMemberFilter();
		resetActionFilter();
	}

	function resetMemberFilter() {
		searchParams.delete('u');
		setSearchParams(searchParams);
	}

	useEffect(() => {
		getAppTeamMembers({
			appId,
			orgId,
		});
	}, []);

	useUpdateEffect(() => {
		const start = searchParams.get('start');
		const end = searchParams.get('end');
		if (start && end) {
			setDate([
				{
					startDate: new Date(start),
					endDate: new Date(end),
					key: 'selection',
				},
			]);
		}
	}, [searchParams.get('start'), searchParams.get('end')]);

	const teamOptions = useMemo(() => {
		const { tempTeam: members } = useApplicationStore.getState();

		return members.map((res) => ({
			label: res.member.name,
			value: res,
		}));
	}, [members]);

	const actorValue = useMemo(() => {
		const ids = searchParams.get('u')?.split(',') ?? [];
		return teamOptions.filter((option) => ids.includes(option.value.member._id));
	}, [searchParams.get('u')]);

	return (
		<div className='p-6 bg-subtle rounded-lg space-y-6'>
			<div className='flex items-center justify-between'>
				<h1 className='text-default text-xl'>Filter</h1>
				<Button variant='blank' className='link' onClick={clearAllFilters}>
					Reset All
				</Button>
			</div>
			<div className='space-y-3'>
				<h5 className='text-default text-sm font-sfCompact'>Team Member</h5>
				<Select
					value={actorValue}
					formatOptionLabel={formatOptionLabel}
					isMulti
					isClearable
					isSearchable
					name='member'
					options={teamOptions}
					className='select-container'
					classNamePrefix='select'
					placeholder='Search team member'
					onChange={(value, actionMeta) => {
						const val = value.map((v) => v.value.member._id).join(',');
						if (val) {
							addNewParam('u', val);
						} else {
							removeParam('u', actionMeta.removedValue?.value.member._id as string);
						}
					}}
				/>
			</div>

			<div className='space-y-3'>
				<div className='flex items-center justify-between'>
					<h5 className='text-default text-sm font-sfCompact'>Activity Type</h5>
					<Button variant='blank' className='link' onClick={resetActionFilter}>
						Clear
					</Button>
				</div>

				{NOTIFICATION_ACTIONS.map((action) => (
					<Checkbox
						key={action}
						id={action}
						label={capitalize(action)}
						checked={
							searchParams
								.get('a')
								?.split(',')
								.some((a) => a === action) ?? false
						}
						onCheckedChange={(checked) => {
							if (checked) {
								addNewParam('a', action);
							} else {
								removeParam('a', action);
							}
						}}
					/>
				))}
			</div>
			<div className='space-y-3'>
				<div className='flex items-center justify-between'>
					<h5 className='text-default text-sm font-sfCompact'>Date Time & Range</h5>
					<Button variant='blank' className='link' onClick={resetDateFilter}>
						Clear
					</Button>
				</div>
				<DateRangePicker
					key={date[0].startDate?.toISOString()}
					date={date}
					onChange={(date) => {
						searchParams.set('start', date[0].startDate?.toISOString() as string);
						searchParams.set('end', date[0].endDate?.toISOString() as string);
						setSearchParams(searchParams);
					}}
				/>
			</div>
		</div>
	);
}
