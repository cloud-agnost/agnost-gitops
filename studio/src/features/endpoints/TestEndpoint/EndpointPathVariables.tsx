import { Input } from '@/components/Input';
import { TableCell, TableRow } from '@/components/Table';
import useEndpointStore from '@/store/endpoint/endpointStore';
import { getPathParams } from '@/utils';
import { FormControl, FormField, FormItem, FormMessage } from 'components/Form';
import { useEffect } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';
import { TestEndpointSchema } from '../TestEndpoint';
import TestEndpointTable from './TestEndpointTable';

export default function EndpointPathVariables() {
	const {
		control,
		formState: { errors },
	} = useFormContext<z.infer<typeof TestEndpointSchema>>();
	const { t } = useTranslation();
	const { endpoint } = useEndpointStore();

	const {
		fields: pathParamFields,
		append: appendPathParams,
		remove: removeParamFields,
	} = useFieldArray({
		control,
		name: 'params.pathVariables',
	});

	useEffect(() => {
		if (endpoint?.path) {
			const values = pathParamFields;
			removeParamFields();
			const pathParams = getPathParams(endpoint.path);
			pathParams.forEach((param) => {
				appendPathParams({
					key: param,
					value: values.find((v) => v.key === param)?.value ?? '',
				});
			});
		}
	}, [endpoint?.path]);

	return (
		<TestEndpointTable>
			{pathParamFields.map((f, index) => (
				<TableRow key={f.id}>
					<TableCell>
						<FormField
							control={control}
							name={`params.pathVariables.${index}.key`}
							render={({ field }) => (
								<FormItem className='flex-1'>
									<FormControl>
										<Input
											placeholder={
												t('forms.placeholder', {
													label: t('resources.database.key'),
												}) ?? ''
											}
											error={!!errors.params?.queryParams?.[index]?.key}
											disabled
											{...field}
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
							name={`params.pathVariables.${index}.value`}
							render={({ field }) => (
								<FormItem className='flex-1'>
									<FormControl>
										<Input
											placeholder={
												t('forms.placeholder', {
													label: t('resources.database.value'),
												}) ?? ''
											}
											error={!!errors.params?.queryParams?.[index]?.value}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</TableCell>
				</TableRow>
			))}
		</TestEndpointTable>
	);
}
