import { CodeEditor } from '@/components/CodeEditor';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/Form';
import { RadioGroup, RadioGroupItem } from '@/components/RadioGroup';
import { cn } from '@/utils';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';
import { TestEndpointSchema } from '../TestEndpoint';
import EndpointFiles from './EndpointFiles';
import useEndpointStore from '@/store/endpoint/endpointStore';
export default function EndpointBody() {
	const { control, watch } = useFormContext<z.infer<typeof TestEndpointSchema>>();
	const { t } = useTranslation();
	const endpoint = useEndpointStore((state) => state.endpoint);
	const bodyType = watch('bodyType');

	return (
		<div className={cn('space-y-4', bodyType === 'json' && 'h-full')}>
			<FormField
				control={control}
				name='bodyType'
				render={({ field }) => (
					<FormItem className='space-y-6'>
						<FormLabel>{t('endpoint.bodyType')}</FormLabel>
						<FormControl>
							<RadioGroup
								onValueChange={field.onChange}
								defaultValue={field.value}
								className='flex items-center gap-x-6'
							>
								{['json', 'form-data'].map((item) => (
									<FormItem className='flex items-center space-x-3 space-y-0' key={item}>
										<FormControl>
											<RadioGroupItem value={item} />
										</FormControl>
										<FormLabel className='select-none cursor-pointer'>
											<p className='text-default'>{t(`endpoint.${item}`)}</p>
										</FormLabel>
									</FormItem>
								))}
							</RadioGroup>
						</FormControl>
					</FormItem>
				)}
			/>

			{bodyType === 'json' && (
				<div className='mt-6 h-full'>
					<FormField
						control={control}
						name='body'
						render={({ field }) => (
							<FormItem className='h-full'>
								<FormControl className='h-full'>
									<CodeEditor
										className='min-h-[100px] h-full'
										containerClassName='h-[calc(100%-6rem)]'
										value={field.value}
										onChange={field.onChange}
										defaultLanguage='json'
										name={`endpointBody-${endpoint._id}`}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
			)}
			{bodyType === 'form-data' && <EndpointFiles />}
		</div>
	);
}
