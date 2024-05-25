import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { DrawerClose, DrawerFooter } from '@/components/Drawer';
import { Input } from '@/components/Input';
import { INSTANCE_PORT_MAP } from '@/constants';
import { TestConnectionButton } from '@/features/resources';
import useAuthorizeOrg from '@/hooks/useAuthorizeOrg';
import useResourceStore from '@/store/resources/resourceStore';
import useTypeStore from '@/store/types/typeStore';
import { ResourceCreateType } from '@/types';
import { cn, isEmpty } from '@/utils';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from 'components/Form';
import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

interface Props {
	children: React.ReactNode;
	loading: boolean;
}

export default function CreateResourceLayout({ children, loading }: Props) {
	const { t } = useTranslation();
	const { resourceConfig, resourceToEdit } = useResourceStore();
	const { appRoles } = useTypeStore();
	const canCreateResource = useAuthorizeOrg('resource.create');
	const form = useFormContext();

	useEffect(() => {
		if (form) {
			form.reset({
				...(!form.getValues('allowedRoles')?.length && { allowedRoles: ['Admin'] }),
				instance: resourceConfig.instance,
				type: resourceConfig.resourceType,
				access: {
					port: INSTANCE_PORT_MAP[resourceConfig.instance],
					options: [],
				},
			});
		}
	}, []);

	return (
		<div className='space-y-8 overflow-auto'>
			{isEmpty(resourceToEdit) && (
				<>
					<FormField
						control={form.control}
						name='name'
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t('resources.resource_name')}</FormLabel>
								<FormControl>
									<Input
										error={Boolean(form.formState.errors.name)}
										placeholder={
											t('forms.placeholder', {
												label: t('general.name'),
											}) ?? ''
										}
										{...field}
									/>
								</FormControl>

								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name='allowedRoles'
						render={({ field: { onChange, value } }) => (
							<div className='space-y-2'>
								<FormLabel>{t('resources.table.allowedRoles')}</FormLabel>
								<div className='flex items-center space-x-6 space-y-0'>
									{appRoles.map((role) => (
										<FormItem key={role} className='flex flex-row items-center space-x-4 space-y-0'>
											<FormControl>
												<Checkbox
													disabled={role === 'Admin'}
													checked={value?.includes(role)}
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
							</div>
						)}
					/>
				</>
			)}

			{children}
			<DrawerFooter
				className={cn(
					'gap-4',
					resourceConfig.type === ResourceCreateType.Existing && 'justify-between',
				)}
			>
				{resourceConfig.type === ResourceCreateType.Existing && <TestConnectionButton />}
				<div className='space-x-4 self-end'>
					<DrawerClose asChild>
						<Button variant='secondary' size='lg'>
							{t('general.cancel')}
						</Button>
					</DrawerClose>
					<Button size='lg' type='submit' loading={loading} disabled={!canCreateResource}>
						{t('general.save')}
					</Button>
				</div>
			</DrawerFooter>
		</div>
	);
}
