import { Button } from '@/components/Button';
import { BASE_URL_WITH_API } from '@/constants';
import { useToast } from '@/hooks';
import useAuthStore from '@/store/auth/authStore';
import useClusterStore from '@/store/cluster/clusterStore';
import { FormatOptionLabelProps, User } from '@/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { SingleValue } from 'react-select';
import AsyncSelect from 'react-select/async';
const formatOptionLabel = ({ label, value }: FormatOptionLabelProps<User>) => {
	const name = label?.split(' ');
	return (
		<div className='flex items-center justify-between w-full'>
			<div className='flex items-center gap-2'>
				{value?.pictureUrl ? (
					<img
						src={`${BASE_URL_WITH_API}/${value?.pictureUrl}`}
						alt={label}
						className='rounded-full object-contain w-7 h-7'
					/>
				) : (
					name && (
						<div
							className='relative inline-flex items-center justify-center cursor-pointer overflow-hidden w-7 h-7 rounded-full'
							style={{
								backgroundColor: value?.color,
							}}
						>
							<span className='text-default text-xs'>
								{name[0]?.charAt(0).toUpperCase()}
								{name[1]?.charAt(0).toUpperCase()}
							</span>
						</div>
					)
				)}
				<div className='flex-1'>
					<p className='text-default text-sm leading-6'>{value.name}</p>
					<p className='text-subtle  text-sm leading-6 transfer-email'>{value.contactEmail}</p>
				</div>
			</div>
		</div>
	);
};

const loadOptions = async (inputValue: string) => {
	const { getActiveUsers } = useClusterStore.getState();
	const users = await getActiveUsers({
		search: inputValue,
		page: 0,
		size: 10,
	});

	return users.map((user) => ({
		label: user.name,
		value: user,
	}));
};

export default function TransferClusterOwnership() {
	const { user } = useAuthStore();
	const { transferClusterOwnership, getActiveUsers } = useClusterStore();
	const navigate = useNavigate();
	const [selectedMember, setSelectedMember] =
		useState<SingleValue<FormatOptionLabelProps<User>>>(null);
	const { toast } = useToast();
	const { t } = useTranslation();

	const { mutate, isPending } = useMutation({
		mutationFn: () =>
			transferClusterOwnership({
				userId: selectedMember?.value._id as string,
			}),
		onSuccess: () => {
			toast({
				title: t('organization.transfer-success') as string,
				action: 'success',
			});
			navigate('/organization');
		},
		onError: (err) => {
			toast({
				title: err.details,
				action: 'error',
			});
		},
	});

	const { data, isPending: loading } = useQuery({
		queryKey: ['getActiveUsers'],
		queryFn: () => getActiveUsers({ page: 0, size: 10, search: '' }),
		select: (data) => data.map((user) => ({ label: user.name, value: user })),
	});

	return (
		<div className='flex flex-col gap-4'>
			<AsyncSelect
				isClearable
				isDisabled={!user?.isClusterOwner}
				isLoading={loading}
				cacheOptions
				onChange={(newValue) => setSelectedMember(newValue)}
				loadOptions={loadOptions}
				defaultOptions={data}
				className='select-container'
				classNamePrefix='select'
				placeholder='Search team member'
				formatOptionLabel={formatOptionLabel}
			/>
			<Button
				size='lg'
				className='self-end'
				onClick={mutate}
				loading={isPending}
				disabled={!user?.isClusterOwner}
			>
				{t('organization.transfer')}
			</Button>
		</div>
	);
}
