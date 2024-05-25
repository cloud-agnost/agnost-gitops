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
import { Separator } from '@/components/Separator';
import { Switch } from '@/components/Switch';
import { CreateTaskSchema } from '@/types';
import { translate as t } from '@/utils';
import { useFormContext } from 'react-hook-form';
import * as z from 'zod';
import CronDescription from './CronDescription';
import CronExamples from './CronExamples';

export default function TaskForm({ loading }: { loading?: boolean }) {
	const form = useFormContext<z.infer<typeof CreateTaskSchema>>();

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
				name='cronExpression'
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t('task.syntax')}</FormLabel>
						<FormControl>
							<CronExamples selectCron={(cron: string) => form.setValue('cronExpression', cron)}>
								<Input
									error={Boolean(form.formState.errors.cronExpression)}
									placeholder={
										t('forms.placeholder', {
											label: t('task.syntax'),
										}) ?? ''
									}
									{...field}
								/>
							</CronExamples>
						</FormControl>
						<CronDescription />
						<FormMessage />
						<Separator className='my-4' />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name='enabled'
				render={({ field }) => (
					<FormItem className='flex justify-between gap-4 items-center space-y-0'>
						<FormLabel>
							<p>{t('general.enabled')}</p>
							<p className='text-subtle'>{t('task.enabledDesc')}</p>
						</FormLabel>

						<FormControl>
							<Switch checked={field.value} onCheckedChange={field.onChange} />
						</FormControl>
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name='logExecution'
				render={({ field }) => (
					<FormItem className='flex justify-between gap-4 items-center space-y-0'>
						<FormLabel>
							<p>{t('task.logExec')}</p>
							<p className='text-subtle'>{t('task.logExecDesc')}</p>
						</FormLabel>

						<FormControl>
							<Switch checked={field.value} onCheckedChange={field.onChange} />
						</FormControl>
					</FormItem>
				)}
			/>

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
