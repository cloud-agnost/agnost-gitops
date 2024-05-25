import { Button } from '@/components/Button';
import { ENDPOINT_ACCESS_PROPERTIES } from '@/constants';
import { EndpointSelectModal } from '@/features/version/EndpointSelectModal';
import { ListEndpoint, Schema } from '@/features/version/SettingsAPIKeys';
import { useUpdateEffect } from '@/hooks';
import useEndpointStore from '@/store/endpoint/endpointStore.ts';
import { Endpoint } from '@/types';
import { cn } from '@/utils';
import { DatePicker } from 'components/DatePicker';
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from 'components/Form';
import { Input } from 'components/Input';
import { RadioGroup, RadioGroupItem } from 'components/RadioGroup';
import { Switch } from 'components/Switch';
import { motion } from 'framer-motion';
import { Dispatch, Fragment, SetStateAction } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';

interface AddOrEditAPIKeyGeneralProps {
	setEndpoints: Dispatch<SetStateAction<Endpoint[]>>;
}

export default function AddOrEditAPIKeyGeneral({ setEndpoints }: AddOrEditAPIKeyGeneralProps) {
	const { t } = useTranslation();
	const form = useFormContext<z.infer<typeof Schema>>();
	const eps = useEndpointStore((state) => state.endpoints);
	const {
		selectEndpointDialogOpen,
		selectedEndpointIds,
		setSelectedEndpointIds,
		setSelectEndpointDialogOpen,
	} = useEndpointStore();

	function openEndpointDialog() {
		const key =
			form.watch('general.endpoint.type') === 'custom-excluded'
				? 'excludedEndpoints'
				: 'allowedEndpoints';
		const data = form.getValues(`general.endpoint.${key}`).map((item) => item.url);
		setSelectedEndpointIds(data);
		setSelectEndpointDialogOpen(true);
	}

	function onSelectEndpoint(endpoint: string[], lastSelected?: Endpoint) {
		const type = form.getValues('general.endpoint.type');
		const data = endpoint.map((iid) => ({
			url: iid,
		}));

		form.setValue(
			`general.endpoint.${type === 'custom-allowed' ? 'allowedEndpoints' : 'excludedEndpoints'}`,
			data,
		);
		form.clearErrors('general.endpoint');
		if (lastSelected) {
			setEndpoints?.((prevState) => [...(prevState ?? []), lastSelected]);
		} else {
			setEndpoints?.((prevState) => prevState?.filter((item) => endpoint.includes(item.iid)));
		}
	}
	const endpointError = form.formState.errors.general?.endpoint?.root?.message;

	useUpdateEffect(() => {
		form.clearErrors('general.endpoint');
	}, [form.watch('general.endpoint.type')]);

	return (
		<>
			<EndpointSelectModal
				key={selectEndpointDialogOpen.toString()}
				open={selectEndpointDialogOpen}
				onOpenChange={setSelectEndpointDialogOpen}
				onSelect={onSelectEndpoint}
				defaultSelected={selectedEndpointIds}
			/>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className='p-6 flex flex-col divide-y [&>:first-child]:pt-0 [&>*]:py-6 overflow-auto'
			>
				<FormField
					control={form.control}
					name='general.name'
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t('version.api_key.name')}</FormLabel>
							<FormControl>
								<Input
									error={Boolean(form.formState.errors.general?.name)}
									placeholder={
										t('forms.placeholder', {
											label: t('version.api_key.name'),
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
					name='general.realtime'
					render={({ field }) => {
						return (
							<FormItem className='grid grid-cols-[2fr_1fr] items-center space-y-0 gap-2'>
								<div>
									<FormLabel>{t('version.api_key.allow_realtime')}</FormLabel>
									<FormDescription>{t('version.api_key.allow_realtime_desc')}</FormDescription>
								</div>
								<FormControl className='justify-self-end'>
									<Switch
										onBlur={field.onBlur}
										ref={field.ref}
										name={field.name}
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						);
					}}
				/>
				<FormField
					control={form.control}
					name='general.endpoint.type'
					render={({ field }) => (
						<FormItem className='space-y-6'>
							<FormLabel>{t('version.api_key.endpoint_access')}</FormLabel>
							<FormControl>
								<div className='flex gap-6 flex-col'>
									<RadioGroup
										onValueChange={field.onChange}
										defaultValue={field.value}
										className='flex flex-col gap-y-6'
									>
										{ENDPOINT_ACCESS_PROPERTIES.map((item, index) => (
											<Fragment key={index}>
												<FormItem className='flex space-x-3 space-y-0'>
													<FormControl className='mt-1'>
														<RadioGroupItem value={item} />
													</FormControl>
													<FormLabel className='select-none cursor-pointer'>
														<p className='text-default'>
															{t(`version.api_key.endpoint_access_${item.replace('-', '_')}`)}
														</p>
														<p className='text-subtle'>
															{t(`version.api_key.endpoint_access_${item.replace('-', '_')}_desc`)}
														</p>
													</FormLabel>
												</FormItem>
												{item === 'custom-allowed' &&
													form.watch('general.endpoint.type') === 'custom-allowed' && (
														<ListEndpoint
															endpoints={eps.filter((item) =>
																form
																	.getValues('general.endpoint.allowedEndpoints')
																	.some((i) => i.url === item.iid),
															)}
															setEndpoints={setEndpoints}
															type='custom-allowed'
														>
															<Button
																className={cn(endpointError && 'border border-error')}
																onClick={openEndpointDialog}
															>
																{t('version.api_key.select_allowed_endpoint')}
															</Button>
															<FormMessage>{endpointError}</FormMessage>
														</ListEndpoint>
													)}
												{item === 'custom-excluded' &&
													form.watch('general.endpoint.type') === 'custom-excluded' && (
														<ListEndpoint
															endpoints={eps.filter((item) =>
																form
																	.getValues('general.endpoint.excludedEndpoints')
																	.some((i) => i.url === item.iid),
															)}
															setEndpoints={setEndpoints}
															type='custom-excluded'
														>
															<Button
																className={cn(endpointError && 'border border-error')}
																onClick={openEndpointDialog}
															>
																{t('version.api_key.select_excluded_endpoint')}
															</Button>
															<FormMessage>{endpointError}</FormMessage>
														</ListEndpoint>
													)}
											</Fragment>
										))}
									</RadioGroup>
								</div>
							</FormControl>
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name='general.expiryDate'
					render={({ field }) => (
						<FormItem className='flex flex-col !pb-0'>
							<FormLabel>{t('version.api_key.expire_date')}</FormLabel>
							<DatePicker
								mode='single'
								selected={field.value}
								onSelect={field.onChange}
								initialFocus
								clearable
							/>
							<FormDescription>{t('version.api_key.expire_date_desc')}</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
			</motion.div>
		</>
	);
}
