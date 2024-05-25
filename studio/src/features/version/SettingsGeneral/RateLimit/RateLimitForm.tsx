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
import { CreateRateLimitSchema } from '@/types';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';
interface RateLimitFormProps {
	loading: boolean;
	onSubmit: (data: z.infer<typeof CreateRateLimitSchema>) => void;
}
export default function RateLimitForm({ loading, onSubmit }: RateLimitFormProps) {
	const { t } = useTranslation();
	const form = useFormContext<z.infer<typeof CreateRateLimitSchema>>();
	return (
		<div className='space-y-6'>
			<FormField
				control={form.control}
				name='name'
				render={({ field }) => (
					<FormItem className='space-y-1'>
						<FormLabel>{t('version.add.rate_limiter.name.label')}</FormLabel>
						<FormControl>
							<Input
								error={Boolean(form.formState.errors.name)}
								placeholder={t('version.add.rate_limiter.name.placeholder') as string}
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
				name='rate'
				render={({ field }) => (
					<FormItem className='space-y-1'>
						<FormLabel>{t('version.add.rate_limiter.rate.label')}</FormLabel>
						<FormControl>
							<Input
								error={Boolean(form.formState.errors.rate)}
								type='number'
								placeholder={t('version.add.rate_limiter.rate.placeholder') as string}
								{...field}
							/>
						</FormControl>
						<FormDescription>{t('version.add.rate_limiter.rate.desc')}</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name='duration'
				render={({ field }) => (
					<FormItem className='space-y-1'>
						<FormLabel>{t('version.add.rate_limiter.duration.label')}</FormLabel>
						<FormControl></FormControl>
						<Input
							error={Boolean(form.formState.errors.duration)}
							type='number'
							placeholder={t('version.add.rate_limiter.duration.placeholder') as string}
							{...field}
						/>
						<FormDescription>{t('version.add.rate_limiter.duration.desc')}</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name='errorMessage'
				render={({ field }) => (
					<FormItem className='space-y-1'>
						<FormLabel>{t('version.add.rate_limiter.error_message.label')}</FormLabel>
						<FormControl>
							<Input
								error={Boolean(form.formState.errors.errorMessage)}
								type='text'
								placeholder={t('version.add.rate_limiter.error_message.placeholder') as string}
								{...field}
							/>
						</FormControl>
						<FormDescription>{t('version.add.rate_limiter.error_message.desc')}</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<div className='mt-4 flex gap-4 justify-end'>
				<DrawerClose asChild>
					<Button variant='secondary' size='lg'>
						{t('general.cancel')}
					</Button>
				</DrawerClose>
				<Button
					loading={loading}
					size='lg'
					type='button'
					onClick={() => form.handleSubmit(onSubmit)()}
				>
					{t('general.save')}
				</Button>
			</div>
		</div>
	);
}
