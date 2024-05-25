import { RadioGroup, RadioGroupItem } from '@/components/RadioGroup';
import { RABBITMQ_CONNECTION_TYPES } from '@/constants';
import {
	ConnectKafka,
	ConnectRabbitMqWithObject,
	ConnectRabbitMqWithURI,
} from '@/features/resources';
import { ConnectResourceSchema, RabbitMQConnFormat, ResourceInstances } from '@/types';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from 'components/Form';
import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';
export default function ConnectQueue() {
	const { t } = useTranslation();
	const form = useFormContext<z.infer<typeof ConnectResourceSchema>>();

	useEffect(() => {
		form.setValue('access.format', RabbitMQConnFormat.URL);
	}, []);

	return (
		<>
			{form.watch('instance') === ResourceInstances.RabbitMQ && (
				<FormField
					control={form.control}
					name='access.format'
					render={({ field }) => (
						<FormItem className='space-y-3'>
							<FormControl>
								<RadioGroup
									onValueChange={field.onChange}
									defaultValue={RabbitMQConnFormat.URL}
									className='flex items-center gap-6 mb-8'
								>
									{RABBITMQ_CONNECTION_TYPES.map((type) => (
										<FormItem key={type} className='flex items-center space-x-3 space-y-0'>
											<FormControl>
												<RadioGroupItem value={type} />
											</FormControl>
											<FormLabel className='font-normal'>{t(`resources.queue.${type}`)}</FormLabel>
										</FormItem>
									))}
								</RadioGroup>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			)}

			{form.watch('instance') === ResourceInstances.Kafka && <ConnectKafka />}

			{form.watch('access.format') === RabbitMQConnFormat.URL &&
				form.watch('instance') === ResourceInstances.RabbitMQ && <ConnectRabbitMqWithURI />}
			{form.watch('access.format') === RabbitMQConnFormat.Object &&
				form.watch('instance') === ResourceInstances.RabbitMQ && <ConnectRabbitMqWithObject />}
		</>
	);
}
