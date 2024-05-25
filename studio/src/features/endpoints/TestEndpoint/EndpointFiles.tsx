import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';
import { TableCell, TableRow } from '@/components/Table';
import { capitalize, fileToSerializedString } from '@/utils';
import { Plus, Trash } from '@phosphor-icons/react';
import { FormControl, FormField, FormItem, FormMessage } from 'components/Form';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';
import { TestEndpointSchema } from '../TestEndpoint';
import TestEndpointTable from './TestEndpointTable';

export default function EndpointFiles() {
	const { control, setValue, watch } = useFormContext<z.infer<typeof TestEndpointSchema>>();
	const { t } = useTranslation();

	const { fields, append, remove } = useFieldArray({
		control,
		name: 'formData',
	});

	function selectFile(index: number) {
		const input = document.createElement('input');
		input.type = 'file';
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (file) {
				const f = await fileToSerializedString(file);
				setValue(`formData.${index}.file`, file);
				setValue(`formData.${index}.key`, file.name);
				setValue(`formData.${index}.value`, f);
			}
		};
		input.click();
	}
	return (
		<TestEndpointTable isFormData>
			{fields.map((f, index) => (
				<TableRow key={f.id}>
					<TableCell>
						<FormField
							control={control}
							name={`formData.${index}.type`}
							render={({ field }) => (
								<FormItem className='flex-1'>
									<FormControl>
										<Select
											onValueChange={(val) => {
												if (field.value !== val) {
													setValue(`formData.${index}.file`, undefined);
													setValue(`formData.${index}.key`, '');
												}
												field.onChange(val);
											}}
										>
											<SelectTrigger
												defaultValue={field.value}
												className='w-[120px] text-xs placeholder:text-xs !h-[30px]'
											>
												<SelectValue>{capitalize(field.value)}</SelectValue>
											</SelectTrigger>

											<SelectContent>
												{['text', 'file']?.map((role) => (
													<SelectItem key={role} value={role} className='text-xs'>
														{role}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</TableCell>

					<TableCell>
						<FormField
							control={control}
							name={`formData.${index}.key`}
							render={({ field }) => (
								<FormItem className='flex-1'>
									<FormControl>
										<Input
											disabled={watch(`formData.${index}.type`) === 'file'}
											variant='sm'
											placeholder={
												t('forms.placeholder', {
													label: t('resources.database.key'),
												}) ?? ''
											}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</TableCell>

					<TableCell>
						{watch(`formData.${index}.type`) === 'text' ? (
							<FormField
								control={control}
								name={`formData.${index}.value`}
								render={({ field }) => (
									<FormItem className='flex-1'>
										<FormControl>
											<Input
												variant='sm'
												placeholder={
													t('forms.placeholder', {
														label: t('resources.database.value'),
													}) ?? ''
												}
												{...field}
											/>
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>
						) : (
							<FormField
								control={control}
								name={`formData.${index}.file`}
								render={({ field }) => (
									<FormItem className='flex-1'>
										<FormControl>
											{field.value ? (
												<Badge
													text={field.value.name}
													onClear={() => {
														field.onChange(undefined);
														remove(index);
													}}
												/>
											) : (
												<Button variant='primary' onClick={() => selectFile(index)}>
													{t('general.select')}
												</Button>
											)}
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>
						)}
					</TableCell>
					<TableCell>
						<Button variant='icon' size='sm' rounded onClick={() => remove(index)}>
							<Trash size={16} className='text-icon-secondary' />
						</Button>
					</TableCell>
				</TableRow>
			))}
			<TableRow>
				<TableCell colSpan={4} className='text-center'>
					<Button variant='secondary' onClick={() => append({ key: '', value: '', type: 'text' })}>
						<Plus size={16} className='text-icon-secondary mr-2' weight='bold' />
						{t('endpoint.test.add_form_data')}
					</Button>
				</TableCell>
			</TableRow>
		</TestEndpointTable>
	);
}
