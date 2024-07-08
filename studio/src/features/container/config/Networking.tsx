import { Button } from '@/components/Button';
import { CopyInput } from '@/components/CopyInput';
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/Form';
import { Input } from '@/components/Input';
import { Separator } from '@/components/Separator';
import { Switch } from '@/components/Switch';
import useContainerStore from '@/store/container/containerStore';
import useEnvironmentStore from '@/store/environment/environmentStore';
import { CreateContainerParams } from '@/types';
import { ArrowRight, ShareNetwork, Trash } from '@phosphor-icons/react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import ContainerFormTitle from './ContainerFormLayout';
import _ from 'lodash';

export default function Networking() {
	const { t } = useTranslation();
	const form = useFormContext<CreateContainerParams>();
	const { container, template } = useContainerStore();
	const { environment } = useEnvironmentStore();

	const visibleFields = template?.config?.visibleFields ?? [];
	const disabledFields = template?.config?.disabledFields ?? [];

	const renderContainerPortInput = () => (
		<FormField
			control={form.control}
			name='networking.containerPort'
			render={({ field }) => (
				<FormItem>
					<FormLabel>{t('container.networking.container_port')}</FormLabel>
					<FormControl>
						<Input
							readOnly={visibleFields.includes('networking.containerPort')}
							className='w-1/3'
							type='number'
							error={Boolean(form.formState.errors.networking?.containerPort)}
							placeholder={
								t('forms.placeholder', { label: t('container.networking.container_port') }) ?? ''
							}
							{...field}
						/>
					</FormControl>
					<FormDescription>{t('container.networking.container_port_help')}</FormDescription>
					<FormMessage />
				</FormItem>
			)}
		/>
	);

	const renderPrivateNetworkingInput = () => (
		<FormField
			control={form.control}
			name='networking.containerPort'
			render={({ field }) => (
				<FormItem>
					<FormLabel>{t('container.networking.private_networking')}</FormLabel>
					<FormControl>
						<div className='flex items-center bg-input-background gap-2 rounded-sm h-9'>
							<p className='px-2'>
								{container?.iid}.{environment.iid}.svc.cluster.local:
							</p>
							<Separator orientation='vertical' className='bg-base-reverse/50 h-3/4' />
							<Input
								readOnly={disabledFields.includes('networking.containerPort')}
								className='rounded-l-none pl-0 flex-1'
								type='number'
								error={Boolean(form.formState.errors.networking?.containerPort)}
								placeholder={
									t('forms.placeholder', { label: t('container.networking.container_port') }) ?? ''
								}
								{...field}
							/>
						</div>
					</FormControl>
					<FormDescription>{t('container.networking.private_networking_help')}</FormDescription>
					<FormMessage />
				</FormItem>
			)}
		/>
	);

	const renderCustomDomainSwitch = () => (
		<FormField
			control={form.control}
			name='networking.customDomain.enabled'
			render={({ field }) => (
				<FormItem className='flex justify-between gap-4 items-center space-y-0'>
					<div>
						<FormLabel>{t('container.networking.custom_domain')}</FormLabel>
						<FormDescription>{t('container.networking.custom_domain_help')}</FormDescription>
					</div>
					<FormControl>
						<Switch
							checked={field.value}
							onCheckedChange={field.onChange}
							disabled={disabledFields.includes('networking.customDomain.enabled')}
						/>
					</FormControl>
				</FormItem>
			)}
		/>
	);

	const renderCustomDomainInput = () => (
		<FormField
			control={form.control}
			name='networking.customDomain.domain'
			disabled={!form.watch('networking.customDomain.enabled')}
			render={({ field }) => (
				<FormItem>
					<FormControl>
						{container?.networking?.customDomain?.added ? (
							<div className='relative'>
								<CopyInput
									disabled={
										!form.watch('networking.customDomain.enabled') ||
										disabledFields.includes('networking.customDomain.domain')
									}
									hasError={Boolean(form.formState.errors.networking?.customDomain?.domain)}
									placeholder={
										t('forms.placeholder', { label: t('container.networking.custom_domain') }) ?? ''
									}
									{...field}
								/>
								<Button
									className='absolute right-9 top-0.5'
									onClick={() => form.setValue('networking.customDomain.domain', '')}
									variant='icon'
									size='sm'
									rounded
								>
									<Trash size={14} />
								</Button>
								<Button variant='link' size='sm'>
									{t('container.networking.show_instructions')}
								</Button>
							</div>
						) : (
							<Input
								disabled={
									!form.watch('networking.customDomain.enabled') ||
									disabledFields.includes('networking.customDomain.domain')
								}
								error={Boolean(form.formState.errors.networking?.customDomain?.domain)}
								placeholder={
									t('forms.placeholder', { label: t('container.networking.custom_domain') }) ?? ''
								}
								{...field}
							/>
						)}
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);

	const renderTcpProxySwitch = () => (
		<FormField
			control={form.control}
			name='networking.tcpProxy.enabled'
			render={({ field }) => (
				<div className='space-y-4'>
					<FormItem className='flex justify-between gap-4 items-center space-y-0'>
						<div>
							<FormLabel>{t('container.networking.tcp_proxy')}</FormLabel>
							<FormDescription>{t('container.networking.tcp_proxy_help')}</FormDescription>
						</div>
						<FormControl>
							<Switch checked={field.value} onCheckedChange={field.onChange} />
						</FormControl>
					</FormItem>
					{form.watch('networking.tcpProxy.enabled') && (
						<div className='flex items-center gap-2'>
							<CopyInput
								className='flex-1'
								readOnly
								value={`${window.location.hostname}:${
									container?.networking?.tcpProxy?.publicPort ?? ''
								}`}
							/>
							<ArrowRight className='self-center' />
							<CopyInput
								className='flex-1'
								readOnly
								value={`${container?.iid}.${environment.iid}.svc.cluster.local:${container?.networking?.containerPort}`}
							/>
						</div>
					)}
				</div>
			)}
		/>
	);

	const renderIngressSwitch = () => (
		<FormField
			control={form.control}
			name='networking.ingress.enabled'
			render={({ field }) => (
				<div className='space-y-4'>
					<FormItem className='flex justify-between gap-4 items-center space-y-0'>
						<div>
							<FormLabel>{t('container.networking.ingress')}</FormLabel>
							<FormDescription>{t('container.networking.ingress_help')}</FormDescription>
						</div>
						<FormControl>
							<Switch
								checked={field.value}
								onCheckedChange={field.onChange}
								disabled={disabledFields.includes('networking.ingress.enabled')}
							/>
						</FormControl>
					</FormItem>
					{form.watch('networking.ingress.enabled') && (
						<CopyInput readOnly value={`${container?.iid}.${window.location.href}`} />
					)}
				</div>
			)}
		/>
	);

	return (
		<ContainerFormTitle title={t('container.networking.title')} icon={<ShareNetwork size={20} />}>
			{_.isNil(container?.iid) ? (
				renderContainerPortInput()
			) : (
				<>
					{renderPrivateNetworkingInput()}
					{renderCustomDomainSwitch()}
					{form.watch('networking.customDomain.enabled') && renderCustomDomainInput()}
					{renderTcpProxySwitch()}
					{renderIngressSwitch()}
				</>
			)}
		</ContainerFormTitle>
	);
}
