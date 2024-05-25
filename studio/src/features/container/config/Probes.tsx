import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/Form';
import { Input } from '@/components/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';
import { Switch } from '@/components/Switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/Tooltip';
import { ContainerType, CreateContainerParams } from '@/types/container';
import { Info, Pulse } from '@phosphor-icons/react';
import { Fragment, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import ContainerFormTitle from './ContainerFormLayout';

const TOOLTIP_FIELDS = [
	'initialDelaySeconds',
	'timeoutSeconds',
	'periodSeconds',
	'failureThreshold',
] as const;

export default function Probes() {
	const { t } = useTranslation();
	const form = useFormContext<CreateContainerParams>();

	const PROBES_TYPES = useMemo(() => {
		if (form.watch('type') === ContainerType.KNativeService) {
			return ['readiness', 'liveness'] as const;
		}
		return ['startup', 'readiness', 'liveness'] as const;
	}, [form.watch('type')]);

	return (
		<ContainerFormTitle
			title={t('container.probes.title')}
			descriptionI18nKey='container.probes.description'
			icon={<Pulse size={20} />}
		>
			{PROBES_TYPES.map((type) => (
				<Fragment key={type}>
					<FormField
						control={form.control}
						name={`probes.${type}.enabled`}
						render={({ field }) => (
							<FormItem className='flex items-center space-y-0 gap-2'>
								<div>
									<FormLabel>{t(`container.probes.${type}`)}</FormLabel>
									<FormDescription className='text-pretty'>
										{t(`container.probes.${type}_help`)}
									</FormDescription>
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
						)}
					/>
					<div className='space-y-6'>
						{form.watch(`probes.${type}.enabled`) && (
							<>
								<FormField
									control={form.control}
									name={`probes.${type}.checkMechanism`}
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('container.probes.check_mechanism')}</FormLabel>
											<Select
												value={field.value}
												defaultValue={field.value}
												onValueChange={field.onChange}
											>
												<FormControl>
													<SelectTrigger className='w-full'>
														<SelectValue>{t(`container.probes.${field.value}`)}</SelectValue>
													</SelectTrigger>
												</FormControl>
												<SelectContent className='max-w-full'>
													<div className='space-y-2'>
														{['exec', 'httpGet', 'tcpSocket'].map((command) => (
															<SelectItem key={command} value={command}>
																{t(`container.probes.${command}`)}
																<p className='text-xs text-subtle text-pretty max-w-[90ch]'>
																	{t(`container.probes.${command}_help`)}
																</p>
															</SelectItem>
														))}
													</div>
												</SelectContent>
											</Select>

											<FormMessage />
										</FormItem>
									)}
								/>

								{form.watch(`probes.${type}.checkMechanism`) === 'exec' && (
									<FormField
										control={form.control}
										name={`probes.${type}.execCommand`}
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t('container.probes.command_to_execute')}</FormLabel>
												<FormControl>
													<Input
														error={Boolean(form.formState.errors.name)}
														placeholder={
															t('forms.placeholder', {
																label: t('container.probes.command').toLowerCase(),
															}) ?? ''
														}
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}
								{form.watch(`probes.${type}.checkMechanism`) === 'tcpSocket' && (
									<FormField
										control={form.control}
										name={`probes.${type}.tcpPort`}
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t('container.probes.port')}</FormLabel>
												<FormControl>
													<Input
														error={Boolean(form.formState.errors.name)}
														placeholder={
															t('forms.placeholder', {
																label: t('container.probes.port').toLowerCase(),
															}) ?? ''
														}
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}
								{form.watch(`probes.${type}.checkMechanism`) === 'httpGet' && (
									<div className='flex gap-4'>
										<FormField
											control={form.control}
											name={`probes.${type}.httpPath`}
											render={({ field }) => (
												<FormItem className='flex-1'>
													<FormLabel>{t('container.probes.path')}</FormLabel>
													<FormControl>
														<Input
															error={Boolean(form.formState.errors.name)}
															placeholder={
																t('forms.placeholder', {
																	label: t('container.probes.path').toLowerCase(),
																}) ?? ''
															}
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name={`probes.${type}.httpPort`}
											render={({ field }) => (
												<FormItem className='flex-1'>
													<FormLabel>{t('container.probes.port')}</FormLabel>
													<FormControl>
														<Input
															error={Boolean(form.formState.errors.name)}
															placeholder={
																t('forms.placeholder', {
																	label: t('container.probes.port').toLowerCase(),
																}) ?? ''
															}
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								)}
								<div className='grid grid-cols-4 gap-4'>
									{TOOLTIP_FIELDS.map((f) => (
										<FormField
											key={f}
											control={form.control}
											name={`probes.${type}.${f}`}
											render={({ field }) => (
												<FormItem>
													<div className='flex items-center gap-1'>
														<FormLabel>{t(`container.probes.${f}`)}</FormLabel>
														<TooltipProvider>
															<Tooltip>
																<TooltipTrigger>
																	<Info size={16} />
																</TooltipTrigger>
																<TooltipContent align='end'>
																	<Trans
																		i18nKey={`container.probes.${f}_help`}
																		components={{ 1: <br /> }}
																	/>
																</TooltipContent>
															</Tooltip>
														</TooltipProvider>
													</div>
													<FormControl>
														<Input
															error={Boolean(form.formState.errors.name)}
															placeholder={
																t('forms.placeholder', {
																	label: t(`container.probes.${f}`).toLowerCase(),
																}) ?? ''
															}
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									))}
								</div>
							</>
						)}
					</div>
				</Fragment>
			))}
		</ContainerFormTitle>
	);
}
