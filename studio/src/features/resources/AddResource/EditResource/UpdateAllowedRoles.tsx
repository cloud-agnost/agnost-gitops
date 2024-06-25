import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/Form';
import { useToast } from '@/hooks';
import useResourceStore from '@/store/resources/resourceStore';
import useTypeStore from '@/store/types/typeStore';
import { AllowedRole } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import * as z from 'zod';
const UpdateAllowedRolesSchema = z.object({
	allowedRoles: z.nativeEnum(AllowedRole).array(),
});

export default function UpdateAllowedRoles() {
	const { toast } = useToast();
	const { t } = useTranslation();
	const { projectRoles } = useTypeStore();
	const { resourceToEdit, updateResourceAllowedRoles } = useResourceStore();
	const form = useForm({
		resolver: zodResolver(UpdateAllowedRolesSchema),
		defaultValues: {
			allowedRoles: resourceToEdit?.allowedRoles ?? ['Admin'],
		},
	});
	const { orgId } = useParams() as Record<string, string>;

	const { mutate, isPending } = useMutation({
		mutationFn: updateResourceAllowedRoles,
		onError: (error: { details: string }) => {
			toast({
				title: error.details,
				action: 'error',
			});
		},
	});
	function onSubmit(data: z.infer<typeof UpdateAllowedRolesSchema>) {
		mutate({
			name: resourceToEdit?.name,
			allowedRoles: data.allowedRoles,
			resourceId: resourceToEdit?._id,
			orgId,
		});
	}

	return (
		<Form {...form}>
			<form className='flex' onSubmit={form.handleSubmit(onSubmit)}>
				<FormField
					control={form.control}
					name='allowedRoles'
					render={({ field: { onChange, value } }) => (
						<FormItem className='flex-1'>
							<FormLabel>{t('resources.table.allowedRoles')}</FormLabel>
							<div className='flex items-center space-x-6 space-y-0'>
								{projectRoles.map((role) => (
									<FormItem key={role} className='flex flex-row items-center space-x-4 space-y-0'>
										<FormControl>
											<Checkbox
												disabled={role === 'Admin'}
												checked={value?.includes(role as AllowedRole)}
												onCheckedChange={(checked) => {
													if (checked) {
														if (!value) {
															onChange([role]);
															return;
														}
														onChange([...value, role]);
													} else {
														onChange(value?.filter((r: string) => r !== role));
													}
												}}
											/>
										</FormControl>
										<FormLabel className='text-sm font-normal'>{role}</FormLabel>
									</FormItem>
								))}
								<FormMessage />
							</div>
						</FormItem>
					)}
				/>
				<Button type='submit' variant='primary' className='self-end' size='lg' loading={isPending}>
					{t('general.save')}
				</Button>
			</form>
		</Form>
	);
}
