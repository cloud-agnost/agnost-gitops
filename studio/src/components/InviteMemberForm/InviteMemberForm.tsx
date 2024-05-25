import { Button } from '@/components/Button';
import { Description } from '@/components/Description';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/Form';
import { Input } from '@/components/Input';
import { Label } from '@/components/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';
import useTypeStore from '@/store/types/typeStore';
import { cn, isEmpty } from '@/utils';
import { Plus, Trash } from '@phosphor-icons/react';
import React, { useEffect, useMemo } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';

export const InviteMemberSchema = z.object({
	member: z
		.array(
			z
				.object({
					email: z.string().email().optional().or(z.literal('')),
					role: z.string().optional().or(z.literal('')),
				})
				.superRefine((val, ctx) => {
					const { email, role } = val;
					if (!role) {
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message: 'Role is required',
							path: ['role'],
						});
					}
					if (!email) {
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message: 'Email is required',
							path: ['email'],
						});
					}
				}),
		)
		.superRefine((val, ctx) => {
			const emails = val.map((v) => v.email).filter(Boolean);
			emails.forEach((item, index) => {
				const hasDuplicate = emails.filter((email) => email === item).length > 1;
				if (hasDuplicate) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: 'Emails must be unique',
						path: [`${index}.email`],
					});
				}
			});
		}),
});
interface InviteMemberFormProps {
	type: 'app' | 'org' | 'project';
	loading: boolean;
	actions?: React.ReactNode;
	title?: string;
	description?: string;
	disabled?: boolean;
}

export default function InviteMemberForm({
	type,
	actions,
	title,
	description,
	disabled,
	loading,
}: InviteMemberFormProps) {
	const { appRoles, orgRoles, appRoleDesc, orgRoleDesc, projectRoles, projectRoleDesc } =
		useTypeStore();

	const form = useFormContext<z.infer<typeof InviteMemberSchema>>();
	const { t } = useTranslation();
	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: 'member',
	});

	const roles = useMemo(() => {
		if (type === 'app') {
			return appRoles;
		}
		if (type === 'org') {
			return orgRoles;
		}
		if (type === 'project') {
			return projectRoles;
		}
		return [];
	}, [type, appRoles, orgRoles]);

	const desc = useMemo(() => {
		if (type === 'app') {
			return appRoleDesc;
		}
		if (type === 'org') {
			return orgRoleDesc;
		}
		if (type === 'project') {
			return projectRoleDesc;
		}
		return {};
	}, [type, appRoleDesc, orgRoleDesc, projectRoleDesc]);

	useEffect(() => {
		if (fields.length === 0) {
			append({ email: '', role: '' });
		}
	}, []);
	return (
		<div className='max-w-2xl space-y-12'>
			{title && <Description title={title}>{description}</Description>}

			<div className='space-y-4'>
				{fields.map((f, index) => (
					<div className='flex gap-2' key={f.id}>
						<FormField
							control={form.control}
							name={`member.${index}.email`}
							render={({ field }) => (
								<FormItem className='flex-1'>
									{index === 0 && <FormLabel>Email</FormLabel>}
									<FormControl>
										<Input
											placeholder='Email'
											error={!!form.formState.errors.member?.[index]?.email}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name={`member.${index}.role`}
							render={({ field }) => (
								<FormItem>
									{index === 0 && <Label>Role</Label>}
									<Select onValueChange={field.onChange}>
										<FormControl>
											<SelectTrigger className='w-[180px]'>
												<SelectValue placeholder='Select a role'>{field.value}</SelectValue>
											</SelectTrigger>
										</FormControl>
										<SelectContent className='w-[400px] !max-h-[500px]'>
											<div className='space-y-2'>
												{roles.map((role) => (
													<SelectItem key={role} value={role} className=''>
														{role}
														<p className='text-xs text-subtle whitespace-break-spaces'>
															{desc[role]}
														</p>
													</SelectItem>
												))}
											</div>
										</SelectContent>
									</Select>

									<FormMessage />
								</FormItem>
							)}
						/>
						<Button
							type='button'
							variant='icon'
							size='sm'
							disabled={fields.length === 1}
							className={cn(
								'rounded-full',
								!index && 'self-end',
								!isEmpty(form.formState.errors) && !index && 'self-center mt-2',
								!isEmpty(form.formState.errors) &&
									isEmpty(form.formState.errors.member?.[0]) &&
									!index &&
									'self-end',
							)}
							onClick={() => {
								remove(index);
							}}
						>
							<Trash size={16} className='text-subtle' />
						</Button>
					</div>
				))}
				<div className='flex justify-between items-center mt-8'>
					{fields.length < 50 && (
						<Button
							type='button'
							disabled={disabled}
							variant='text'
							onClick={() => {
								append({ email: '', role: '' });
							}}
						>
							<Plus size={16} />
							<span className='ml-2'>Add Another One</span>
						</Button>
					)}
				</div>

				<div className='flex items-center justify-end gap-4'>
					{actions}
					<Button variant='primary' loading={loading} disabled={disabled} type='submit'>
						{t('application.edit.invite')}
					</Button>
				</div>
			</div>
		</div>
	);
}
