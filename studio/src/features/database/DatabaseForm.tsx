import { Button } from '@/components/Button';
import { DrawerClose } from '@/components/Drawer';
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/Form';
import { Input } from '@/components/Input';
import { ResourceSelect } from '@/components/ResourceSelect';
import { Switch } from '@/components/Switch';
import { ResourceType } from '@/types';
import { Separator } from '@radix-ui/react-dropdown-menu';
import { t } from 'i18next';
import { useFormContext } from 'react-hook-form';

export default function DatabaseForm({
	loading,
	edit,
	disabled,
}: {
	loading: boolean;
	edit?: boolean;
	disabled?: boolean;
}) {
	const form = useFormContext();
	return (
		<>
			<FormField
				control={form.control}
				name='name'
				render={({ field, formState: { errors } }) => (
					<FormItem className='space-y-1'>
						<FormLabel>{t('database.add.field')}</FormLabel>
						<FormControl>
							<Input
								error={Boolean(errors.name)}
								type='text'
								disabled={edit && disabled}
								placeholder={
									t('forms.placeholder', {
										label: t('database.add.field').toLowerCase(),
									}) as string
								}
								{...field}
							/>
						</FormControl>
						<FormDescription>{t('forms.max64.description')}</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<Separator />

			<FormField
				control={form.control}
				name='assignUniqueName'
				disabled={edit}
				render={({ field }) => (
					<FormItem className='flex justify-between gap-4  space-y-0'>
						<FormLabel>
							<h6>{t('database.add.unique.title')}</h6>
							<p className='text-subtle'>{t('database.add.unique.desc')}</p>
						</FormLabel>
						<FormControl>
							<Switch checked={field.value} onCheckedChange={field.onChange} disabled={edit} />
						</FormControl>
					</FormItem>
				)}
			/>
			{/* <FormField
						control={form.control}
						name='managed'
						render={({ field }) => (
							<FormItem className='flex justify-between gap-4 items-center space-y-0'>
								<FormLabel>
									<h6>{t('database.add.managed.title')}</h6>
									<p className='text-subtle'>{t('database.add.managed.desc')}</p>
								</FormLabel>
								<FormControl>
									<Switch checked={field.value} onCheckedChange={field.onChange} />
								</FormControl>
							</FormItem>
						)}
					/> */}

			<Separator />
			<FormField
				control={form.control}
				name='poolSize'
				render={({ field, formState: { errors } }) => (
					<FormItem className='space-y-1'>
						<FormLabel>{t('database.add.poolSize')}</FormLabel>
						<FormControl>
							<Input
								error={Boolean(errors.name)}
								type='number'
								placeholder={
									t('forms.placeholder', {
										label: t('database.add.poolSize').toLowerCase(),
									}) as string
								}
								{...field}
								onChange={undefined}
								onInput={(e) => field.onChange(e.currentTarget.valueAsNumber)}
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
			<Separator />
			{!edit && (
				<FormField
					control={form.control}
					name='resourceId'
					render={({ field }) => (
						<FormItem className='space-y-1'>
							<FormLabel>{t('database.add.resource.field')}</FormLabel>
							<ResourceSelect
								className='w-full'
								defaultValue={field.value}
								value={field.value}
								name={field.name}
								onValueChange={field.onChange}
								error={Boolean(form.formState.errors.resourceId)}
								type={ResourceType.Database}
							/>
							<FormMessage />
						</FormItem>
					)}
				/>
			)}

			<div className='flex justify-end gap-4'>
				<DrawerClose asChild>
					<Button variant='secondary' size='lg'>
						{t('general.cancel')}
					</Button>
				</DrawerClose>
				<Button size='lg' loading={loading} type='submit'>
					{edit ? t('general.save') : t('general.create')}
				</Button>
			</div>
		</>
	);
}
