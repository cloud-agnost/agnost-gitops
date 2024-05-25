import { Button } from '@/components/Button';
import { DrawerClose, DrawerFooter } from '@/components/Drawer';
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
import useResourceStore from '@/store/resources/resourceStore';
import { CreateCacheSchema, ResourceType } from '@/types';
import { translate as t } from '@/utils';
import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import * as z from 'zod';

interface CacheFormProps {
	edit?: boolean;
	loading: boolean;
}
export default function CacheForm({ edit = false, loading }: CacheFormProps) {
	const form = useFormContext<z.infer<typeof CreateCacheSchema>>();
	const { getResources } = useResourceStore();
	const { orgId } = useParams() as Record<string, string>;
	useEffect(() => {
		getResources({
			orgId,
			type: 'cache',
		});
	}, []);
	return (
		<div className='space-y-6'>
			<FormField
				control={form.control}
				name='name'
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t('general.name')}</FormLabel>
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
						<FormDescription>{t('forms.max64.description')}</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				disabled={edit}
				name='assignUniqueName'
				render={({ field }) => (
					<FormItem className='flex justify-between gap-4 items-center space-y-0'>
						<FormLabel>
							<p>{t('cache.assignUniqueName')}</p>
							<p className='text-subtle'>{t('cache.assignUniqueNameDesc')}</p>
						</FormLabel>

						<FormControl>
							<Switch checked={field.value} onCheckedChange={field.onChange} disabled={edit} />
						</FormControl>
					</FormItem>
				)}
			/>
			{!edit && (
				<FormField
					control={form.control}
					name='resourceId'
					render={({ field }) => (
						<FormItem className='space-y-1'>
							<FormLabel>{t('queue.create.resource.title')}</FormLabel>
							<FormControl>
								<ResourceSelect
									defaultValue={field.value}
									value={field.value}
									name={field.name}
									onValueChange={field.onChange}
									error={Boolean(form.formState.errors.resourceId)}
									type={ResourceType.Cache}
								/>
							</FormControl>
							<FormDescription>{t('queue.create.resource.description')}</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
			)}

			<DrawerFooter className='mt-8'>
				<div className='flex justify-end'>
					<DrawerClose asChild>
						<Button variant='secondary' size='lg'>
							{t('general.cancel')}
						</Button>
					</DrawerClose>
					<Button className='ml-2' type='submit' size='lg' loading={loading}>
						{t('general.save')}
					</Button>
				</div>
			</DrawerFooter>
		</div>
	);
}
