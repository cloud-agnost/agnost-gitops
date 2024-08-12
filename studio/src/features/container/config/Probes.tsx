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
import { CreateContainerParams } from '@/types';
import { Info, Pulse } from '@phosphor-icons/react';
import { Fragment } from 'react';
import { useFormContext } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import ContainerFormTitle from './ContainerFormLayout';
import useContainerStore from '@/store/container/containerStore';

const TOOLTIP_FIELDS = [
	'initialDelaySeconds',
	'timeoutSeconds',
	'periodSeconds',
	'failureThreshold',
] as const;

export default function Probes() {
	const { t } = useTranslation();
	const form = useFormContext<CreateContainerParams>();
	const { template } = useContainerStore();
	const visibleFields = template?.config?.visibleFields ?? [];
	const disabledFields = template?.config?.disabledFields ?? [];
	const PROBES_TYPES = ['startup', 'readiness', 'liveness'] as const;

	return (
		<ContainerFormTitle
			title={t('container.probes.title')}
			descriptionI18nKey='container.probes.description'
			icon={<Pulse size={20} />}
		>
			{PROBES_TYPES?.map((type) => (
				<Fragment key={type}>
					{(visibleFields?.includes(`probes.${type}.enabled`) || !visibleFields.length) && (
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
											disabled={disabledFields?.includes(`probes.${type}.enabled`)}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					)}
					{form.watch(`probes.${type}.enabled`) && (
						<div className='space-y-6'>
							{(visibleFields?.includes(`probes.${type}.checkMechanism`) ||
								!visibleFields.length) && (
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
												disabled={disabledFields?.includes(`probes.${type}.checkMechanism`)}
											>
												<FormControl>
													<SelectTrigger className='w-full'>
														<SelectValue>{t(`container.probes.${field.value}`)}</SelectValue>
													</SelectTrigger>
												</FormControl>
												<SelectContent className='max-w-full max-h-full'>
													{['exec', 'httpGet', 'tcpSocket'].map((command) => (
														<SelectItem key={command} value={command}>
															{t(`container.probes.${command}`)}
															<p className='text-xs text-subtle text-pretty max-w-[90ch]'>
																{t(`container.probes.${command}_help`)}
															</p>
														</SelectItem>
													))}
												</SelectContent>
											</Select>

											<FormMessage />
										</FormItem>
									)}
								/>
							)}
							{form.watch(`probes.${type}.checkMechanism`) === 'exec' &&
								(visibleFields?.includes(`probes.${type}.execCommand`) ||
									!visibleFields.length) && (
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
														disabled={disabledFields?.includes(`probes.${type}.execCommand`)}
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}
							{form.watch(`probes.${type}.checkMechanism`) === 'tcpSocket' &&
								(visibleFields?.includes(`probes.${type}.tcpPort`) || !visibleFields.length) && (
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
														disabled={disabledFields?.includes(`probes.${type}.tcpPort`)}
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
									{(visibleFields?.includes(`probes.${type}.httpPath`) ||
										!visibleFields.length) && (
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
															disabled={disabledFields?.includes(`probes.${type}.httpPath`)}
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									)}
									{(visibleFields?.includes(`probes.${type}.httpPort`) ||
										!visibleFields.length) && (
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
															disabled={disabledFields?.includes(`probes.${type}.httpPort`)}
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									)}
								</div>
							)}
							<div className='grid grid-cols-4 gap-4'>
								{TOOLTIP_FIELDS.map(
									(f) =>
										(visibleFields?.includes(`probes.${type}.${f}`) || !visibleFields.length) && (
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
																	<TooltipTrigger type='button'>
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
																disabled={disabledFields?.includes(`probes.${type}.${f}`)}
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										),
								)}
							</div>
						</div>
					)}
				</Fragment>
			))}
		</ContainerFormTitle>
	);
}
