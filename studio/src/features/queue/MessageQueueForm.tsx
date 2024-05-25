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
import useMessageQueueStore from '@/store/queue/messageQueueStore';
import useResourceStore from '@/store/resources/resourceStore';
import { CreateMessageQueueSchema, ResourceType } from '@/types';
import { translate as t } from '@/utils';
import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import * as z from 'zod';

export default function MessageQueueForm({ edit, loading }: { edit?: boolean; loading: boolean }) {
	const form = useFormContext<z.infer<typeof CreateMessageQueueSchema>>();
	const { resources } = useResourceStore();
	const { queue } = useMessageQueueStore();
	const selectedResource = useMemo(
		() => resources.find((item) => item._id === form.getValues('resourceId')),
		[form.watch('resourceId'), resources],
	);
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
				name='logExecution'
				render={({ field }) => (
					<FormItem className='flex justify-between gap-4 items-center space-y-0'>
						<FormLabel>
							<p>{t('queue.create.logExec')}</p>
							<p className='text-subtle'>{t('queue.create.logExecDescription')}</p>
						</FormLabel>

						<FormControl>
							<Switch checked={field.value} onCheckedChange={field.onChange} />
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
									type={ResourceType.Queue}
								/>
							</FormControl>
							<FormDescription>{t('queue.create.resource.description')}</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
			)}
			{(selectedResource?.config?.delayedMessages || (edit && queue.delayedMessages)) && (
				<FormField
					control={form.control}
					name='delay'
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t('queue.create.delay')}</FormLabel>
							<FormControl>
								{/* // eslint-disable-next-line @typescript-eslint/ban-ts-comment
				/* @ts-ignore */}
								<Input
									type='number'
									error={Boolean(form.formState.errors.delay)}
									placeholder={
										t('forms.placeholder', {
											label: t('queue.create.delay'),
										}) ?? ''
									}
									{...field}
									{...form.register('delay', {
										setValueAs: (v) => (v === '' ? null : parseInt(v)),
									})}
								/>
							</FormControl>
							<FormDescription>{t('queue.create.delay_description')}</FormDescription>
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
