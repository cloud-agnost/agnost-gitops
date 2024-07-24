import { Button } from '@/components/Button';
import { Description } from '@/components/Description';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/Form';
import { Input } from '@/components/Input';
import { Label } from '@/components/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';
import useTypeStore from '@/store/types/typeStore';
import { cn } from '@/utils';
import { Plus, Trash } from '@phosphor-icons/react';
import _ from 'lodash';
import React, { useEffect, useMemo } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';

export const InviteMemberSchema = z.object({
	member: z.array(
		z.object({
			name: z.string(),
			role: z
				.string({
					required_error: 'Role is required',
				})
				.trim()
				.refine((val) => val !== '', {
					message: 'Role is required',
				}),
		}),
	),
});
interface InviteMemberFormProps {
	type: 'org' | 'project';
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
}: Readonly<InviteMemberFormProps>) {
	const { orgRoles, orgRoleDesc, projectRoles, projectRoleDesc } = useTypeStore();

	const form = useFormContext<z.infer<typeof InviteMemberSchema>>();
	const { t } = useTranslation();
	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: 'member',
	});

	const roles = useMemo(() => {
		if (type === 'org') {
			return orgRoles;
		}
		if (type === 'project') {
			return projectRoles;
		}
		return [];
	}, [type, orgRoles]);

	const desc = useMemo(() => {
		if (type === 'org') {
			return orgRoleDesc;
		}
		if (type === 'project') {
			return projectRoleDesc;
		}
		return {};
	}, [type, orgRoleDesc, projectRoleDesc]);

	useEffect(() => {
		if (fields.length === 0) {
			append({ name: '', role: '' });
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
							name={`member.${index}.name`}
							render={({ field }) => (
								<FormItem className='flex-1'>
									{index === 0 && <FormLabel>Name</FormLabel>}
									<FormControl>
										<Input
											placeholder='Name'
											error={!!form.formState.errors.member?.[index]?.name}
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
								!_.isEmpty(form.formState.errors) && !index && 'self-center mt-2',
								!_.isEmpty(form.formState.errors) &&
									_.isEmpty(form.formState.errors.member?.[0]) &&
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
								append({ name: '', role: '' });
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
						{t('project.edit.invite')}
					</Button>
				</div>
			</div>
		</div>
	);
}
