import { Alert, AlertDescription, AlertTitle } from '@/components/Alert';
import { Button } from '@/components/Button';
import { useToast } from '@/hooks';
import useApplicationStore from '@/store/app/applicationStore';
import useAuthStore from '@/store/auth/authStore';
import useOrganizationStore from '@/store/organization/organizationStore';
import { TransferRequest } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import { Avatar, AvatarFallback, AvatarImage } from '../Avatar';
import { Form, FormControl, FormField, FormItem, FormMessage } from '../Form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../Select';
import { Badge } from '../Badge';
import { BADGE_COLOR_MAP } from '@/constants';
import { useMemo } from 'react';
import useProjectStore from '@/store/project/projectStore';
interface TransferOwnershipProps {
	disabled: boolean;
	transferFn: (data: TransferRequest) => Promise<any>;
	type: 'org' | 'app' | 'cluster' | 'project';
}

const TransferOwnershipSchema = z.object({
	userId: z.string().nonempty(),
});

export default function TransferOwnership({ transferFn, type, disabled }: TransferOwnershipProps) {
	const user = useAuthStore((state) => state.user);
	const { t } = useTranslation();
	const { members } = useOrganizationStore();
	const { applicationTeam, application } = useApplicationStore();
	const { projectTeam } = useProjectStore();

	const { toast } = useToast();
	const { orgId } = useParams() as Record<string, string>;
	const form = useForm<z.infer<typeof TransferOwnershipSchema>>({
		mode: 'onChange',
		resolver: zodResolver(TransferOwnershipSchema),
	});

	const {
		mutateAsync,
		isPending: loading,
		error,
	} = useMutation({
		mutationFn: transferFn,
		onSuccess: () => {
			form.reset();
			toast({
				title: t('organization.transfer-success') as string,
				action: 'success',
			});
		},
		onError: (err) => {
			toast({
				title: err.details,
				action: 'error',
			});
		},
	});

	const onSubmit = async (data: z.infer<typeof TransferOwnershipSchema>) => {
		mutateAsync({
			...data,
			...(type !== 'cluster' && { orgId: orgId }),
			...(type === 'app' && { appId: application?._id }),
		});
	};

	const team = useMemo(() => {
		switch (type) {
			case 'org':
				return members.filter(({ member }) => member._id !== user?._id);
			case 'app':
				return applicationTeam.filter(({ member }) => member._id !== user?._id);
			case 'cluster':
				return members.filter(({ member }) => member._id !== user?._id);
			case 'project':
				return projectTeam.filter(({ member }) => member._id !== user?._id);
			default:
				return [];
		}
	}, [type]);

	const selectedMember = useMemo(() => {
		return team.find(({ member }) => member._id === form.watch('userId'))?.member;
	}, [form.watch('userId'), team]);

	return (
		<div className='space-y-4'>
			{error && (
				<Alert variant='error'>
					<AlertTitle>{error?.error}</AlertTitle>
					<AlertDescription>{error?.details}</AlertDescription>
				</Alert>
			)}
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 mt-4'>
					<FormField
						control={form.control}
						name='userId'
						render={({ field }) => (
							<FormItem className='space-y-1'>
								<FormControl>
									<Select
										key={field.value}
										defaultValue={field.value}
										onValueChange={field.onChange}
										disabled={disabled}
									>
										<FormControl>
											<SelectTrigger error={error} className='w-full  [&>span]:!max-w-full'>
												<SelectValue
													placeholder={`${t('general.select')} ${t('general.member.title')}`}
												>
													<div className='flex items-center justify-between w-full'>
														<div className='flex items-center gap-2'>
															{selectedMember && (
																<Avatar size='xs'>
																	<AvatarImage src={selectedMember?.pictureUrl} />
																	<AvatarFallback
																		isUserAvatar
																		color={selectedMember?.color ?? 'gray'}
																		name={selectedMember?.name}
																	/>
																</Avatar>
															)}

															<p className='text-default text-sm leading-6'>
																{selectedMember?.name}
															</p>
														</div>
													</div>
												</SelectValue>
											</SelectTrigger>
										</FormControl>
										<SelectContent align='center'>
											{team.map(({ member, role }) => (
												<SelectItem
													key={member._id}
													value={member._id}
													className='w-full'
													hideIndicator
												>
													<div className='flex items-center justify-between w-full'>
														<div className='flex items-center gap-2'>
															<Avatar size='sm'>
																<AvatarImage src={member.pictureUrl} />
																<AvatarFallback
																	isUserAvatar
																	color={member?.color}
																	name={member?.name}
																/>
															</Avatar>
															<div className='flex-1'>
																<p className='text-default text-sm leading-6'>{member.name}</p>
																<p className='text-subtle  text-sm leading-6'>
																	{member.contactEmail}
																</p>
															</div>
														</div>
														<Badge
															key={role}
															text={role}
															variant={BADGE_COLOR_MAP[role.toUpperCase()]}
														/>
													</div>
												</SelectItem>
											))}
											{!team.length && (
												<SelectItem value='empty' disabled>
													{t('general.no_member_found')}
												</SelectItem>
											)}
										</SelectContent>
									</Select>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button
						size='lg'
						className='text-end'
						type='submit'
						loading={loading}
						disabled={disabled || !form.formState.isValid}
					>
						{t('organization.transfer')}
					</Button>
				</form>
			</Form>
		</div>
	);
}
