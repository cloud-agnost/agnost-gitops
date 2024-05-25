import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { TableCell, TableRow } from '@/components/Table';
import { Plus, Trash } from '@phosphor-icons/react';
import { FormControl, FormField, FormItem, FormMessage } from 'components/Form';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';
import { TestEndpointSchema } from '../TestEndpoint';
import TestEndpointTable from './TestEndpointTable';
export default function EndpointHeaders() {
	const { t } = useTranslation();
	const {
		control,
		formState: { errors },
	} = useFormContext<z.infer<typeof TestEndpointSchema>>();

	const { fields, append, remove } = useFieldArray({
		control,
		name: 'headers',
	});

	return (
		<TestEndpointTable>
			{fields.map((f, index) => (
				<TableRow key={f.id}>
					<TableCell>
						<FormField
							control={control}
							name={`headers.${index}.key`}
							render={({ field }) => (
								<FormItem className='flex-1'>
									<FormControl>
										<Input
											key={f.id}
											placeholder={
												t('forms.placeholder', {
													label: t('resources.database.key'),
												}) ?? ''
											}
											error={!!errors.headers?.[index]?.key}
											{...field}
											variant='sm'
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</TableCell>
					<TableCell>
						<FormField
							control={control}
							name={`headers.${index}.value`}
							render={({ field }) => (
								<FormItem className='flex-1'>
									<FormControl>
										<Input
											key={f.id}
											placeholder={
												t('forms.placeholder', {
													label: t('resources.database.value'),
												}) ?? ''
											}
											error={!!errors.headers?.[index]?.value}
											{...field}
											variant='sm'
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</TableCell>
					<TableCell>
						<Button variant='icon' size='sm' rounded onClick={() => remove(index)}>
							<Trash size={16} className='text-icon-secondary' />
						</Button>
					</TableCell>
				</TableRow>
			))}
			<TableRow>
				<TableCell colSpan={3} className='text-center'>
					<Button variant='secondary' onClick={() => append({ key: '', value: '' })}>
						<Plus size={16} className='text-icon-secondary mr-2' weight='bold' />
						{t('endpoint.test.add_header')}
					</Button>
				</TableCell>
			</TableRow>
		</TestEndpointTable>
	);
}
