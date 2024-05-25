import { RadioGroup, RadioGroupItem } from '@/components/RadioGroup';
import { MONGODB_CONNECTION_FORMATS } from '@/constants';
import { ConnectResourceSchema, MongoDBConnFormat } from '@/types';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from 'components/Form';
import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';

export default function MongoConnectionFormat() {
	const { t } = useTranslation();
	const form = useFormContext<z.infer<typeof ConnectResourceSchema>>();

	useEffect(() => {
		form.setValue('access.connFormat', MongoDBConnFormat.MongoDBSRV);
	}, []);

	return (
		<>
			<h6 className=' font-sfCompact text-sm text-subtle '>
				{t('resources.database.selectConnFormat').toUpperCase()}
			</h6>
			<FormField
				control={form.control}
				name='access.connFormat'
				render={({ field }) => (
					<FormItem className='space-y-3'>
						<FormControl>
							<RadioGroup
								onValueChange={field.onChange}
								defaultValue={MongoDBConnFormat.MongoDBSRV}
								className='flex items-center gap-6 mb-8'
							>
								{MONGODB_CONNECTION_FORMATS.map((type) => (
									<FormItem key={type} className='flex items-center space-x-3 space-y-0'>
										<FormControl>
											<RadioGroupItem value={type} />
										</FormControl>
										<FormLabel className='font-normal'>{t(`resources.database.${type}`)}</FormLabel>
									</FormItem>
								))}
							</RadioGroup>
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		</>
	);
}
