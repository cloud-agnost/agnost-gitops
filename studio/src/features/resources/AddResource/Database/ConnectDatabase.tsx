import { Switch } from '@/components/Switch';
import { ConnectResourceSchema, ResourceInstances } from '@/types';
import { FormControl, FormField, FormItem, FormLabel } from 'components/Form';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';
import {
	ConnectOptions,
	DatabaseInfo,
	MongoConnectionFormat,
	ReadReplicas,
} from '@/features/resources';

export default function ConnectDatabase() {
	const { t } = useTranslation();
	const form = useFormContext<z.infer<typeof ConnectResourceSchema>>();

	return (
		<>
			{form.watch('instance') === ResourceInstances.MongoDB && <MongoConnectionFormat />}
			<DatabaseInfo modal={false} />
			<ConnectOptions />
			{form.watch('instance') !== ResourceInstances.MongoDB && <ReadReplicas />}

			{form.watch('instance') === ResourceInstances.SQLServer && (
				<FormField
					control={form.control}
					name='access.encrypt'
					render={({ field }) => (
						<FormItem className='flex justify-start gap-4 items-center space-y-0'>
							<FormLabel>{t('resources.database.secure_connection')}</FormLabel>
							<FormControl>
								<Switch checked={field.value} onCheckedChange={field.onChange} />
							</FormControl>
						</FormItem>
					)}
				/>
			)}
		</>
	);
}
