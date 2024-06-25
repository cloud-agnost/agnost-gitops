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
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import DnsSettings from './DnsSettings';

interface CustomDomainFormProps {
	loading?: boolean;
	modal?: boolean;
}

export default function CustomDomainForm({ loading, modal }: CustomDomainFormProps) {
	const form = useFormContext();
	const { t } = useTranslation();
	return (
		<div className='space-y-6'>
			{modal && <DnsSettings />}
			<FormField
				control={form.control}
				name='domain'
				render={({ field }) => (
					<FormItem className='flex-1'>
						<FormLabel>{t('cluster.add_domain')}</FormLabel>
						<FormControl>
							<Input
								error={!!form.formState.errors.domain}
								placeholder={t('forms.placeholder', {
									label: t('cluster.domain.title'),
								}).toString()}
								{...field}
							/>
						</FormControl>
						<FormDescription>{t('cluster.domains_description')}</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			{modal && (
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
			)}
		</div>
	);
}
