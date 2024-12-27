import { Accordion, AccordionContent, AccordionItem } from '@/components/Accordion';
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
import { Switch } from '@/components/Switch';
import DnsSettings from '@/features/cluster/CustomDomain/DnsSettings';
import useClusterStore from '@/store/cluster/clusterStore';
import useContainerStore from '@/store/container/containerStore';
import useEnvironmentStore from '@/store/environment/environmentStore';
import { CreateContainerParams, CustomDomainSchema } from '@/types';
import { isRootDomain, isWildcardDomain } from '@/utils';
import { ArrowRight, CaretDown, ShareNetwork, Trash } from '@phosphor-icons/react';
import { AccordionTrigger } from '@radix-ui/react-accordion';
import _ from 'lodash';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import ContainerFormTitle from './ContainerFormLayout';
import { CopyButton } from '@/components/CopyButton';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/Alert';
import { useMemo } from 'react';

export default function Networking() {
	const { t } = useTranslation();
	const form = useFormContext<CreateContainerParams>();
	const { container, template } = useContainerStore();
	const { environment } = useEnvironmentStore();
	const { cluster } = useClusterStore();
	const disabledFields = template?.config?.disabledFields ?? [];
	const visibleFields = template?.config?.visibleFields ?? [];

	const isValidDomain =  useMemo(() => {
		let domain = form.watch('networking.customDomain.domain')?.trim() ?? '';
		if (domain.startsWith("*.")) domain = domain.replace("*.", "");

		try {
			CustomDomainSchema.parse({ domain: domain });
			return true;
		} catch (error) {
			return false;
		}
	}, [form.watch('networking.customDomain.domain')]);

	const renderContainerPortInput = () => (
		<FormField
			control={form.control}
			name='networking.containerPort'
			render={({ field }) => (
				<FormItem>
					<FormLabel>{t('container.networking.container_port')}</FormLabel>
					<FormControl>
						<Input
							disabled={disabledFields.includes('networking.containerPort')}
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

	const renderPrivateNetworkingInput = () => {
		if (!visibleFields.length || visibleFields.includes('networking.containerPort'))
			return (
				<FormField
					control={form.control}
					name='networking.containerPort'
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t('container.networking.private_networking')}</FormLabel>
							<FormControl>
								<div className='flex items-center bg-input-background rounded-sm h-9'>
									<p className='px-2 bg-wrapper-background-hover h-full flex items-center justify-center'>
										{container?.iid}.{environment.iid}.svc.cluster.local:
									</p>
									<Input
										disabled={disabledFields.includes('networking.containerPort')}
										className='rounded-l-none pl-1 flex-1'
										type='number'
										error={Boolean(form.formState.errors.networking?.containerPort)}
										placeholder={
											t('forms.placeholder', { label: t('container.networking.container_port') }) ??
											''
										}
										{...field}
									/>
									<CopyButton
										text={`${container?.iid}.${environment.iid}.svc.cluster.local:${form.watch(
											'networking.containerPort',
										)}`}
										className='mr-2'
									/>
								</div>
							</FormControl>
							<FormDescription>{t('container.networking.private_networking_help')}</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
			);
		return null;
	};
	const renderCustomDomainSwitch = () => {
		if (!visibleFields.length || visibleFields.includes('networking.customDomain.enabled'))
			return (
				<>
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
										disabled={
											_.isEmpty(cluster.domains) ||
											disabledFields.includes('networking.customDomain.enabled')
										}
									/>
								</FormControl>
							</FormItem>
						)}
					/>
					{_.isEmpty(cluster.domains) && (
						<Alert variant='warning'>
							<AlertDescription className='text-slate-300'>
								{t('container.networking.no_domain_warning')}
							</AlertDescription>
						</Alert>
					)}
				</>
			);
		return null;
	};

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
					{!_.isEmpty(cluster.domains) && isValidDomain && (
						<Accordion type='single' collapsible className='w-full'>
							<AccordionItem value='dns' className='border-none group'>
								<AccordionTrigger className='link flex items-center justify-center gap-2'>
									<div>
										<span className='hidden group-data-[state=closed]:inline'>Show</span>
										<span className='hidden group-data-[state=open]:inline'>Hide</span> DNS
										configuration instructions
									</div>
									<CaretDown className='shrink-0 text-icon-base transition-transform duration-200 group-data-[state=open]:rotate-180' />
								</AccordionTrigger>
								<AccordionContent>
									<DnsSettings
										description='To finalize setting up your custom domain, please add the following entries to your domain DNS records'
										ips={cluster.ips}
										slug={container?.slug ?? ''}
										isWildcard={
											isWildcardDomain(form.watch('networking.customDomain.domain') ?? '') ?? false
										}
										isContainer
										isRootDomain={isRootDomain(form.watch('networking.customDomain.domain') ?? '')}
									/>
								</AccordionContent>
							</AccordionItem>
						</Accordion>
					)}
					<FormMessage />
				</FormItem>
			)}
		/>
	);

	const renderTcpProxySwitch = () => {
		if (!visibleFields.length || visibleFields.includes('networking.tcpProxy.enabled'))
			return (
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
		return null;
	};

	const renderIngressSwitch = () => {
		if (!visibleFields.length || visibleFields.includes('networking.ingress.enabled'))
			return (
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
										onCheckedChange={(value) => {
											field.onChange(value);
											if (value) {
												form.setValue('networking.ingress.type', 'subdomain');
											}
										}}
										disabled={
											_.isEmpty(cluster.domains) ||
											disabledFields.includes('networking.ingress.enabled')
										}
									/>
								</FormControl>
							</FormItem>
							{form.watch('networking.ingress.enabled') && (
								<div className='input input-md flex items-center justify-between'>
									<Link
										to={`http://${container?.iid}-${environment.iid}.${cluster.domains[0]}`}
										className='link'
										rel='noreferrer noopener'
										target='_blank'
									>
										<p>{`${container?.iid}-${environment.iid}.${cluster.domains[0]}`}</p>
									</Link>
									<CopyButton text={`${container?.iid}-${environment.iid}.${cluster.domains[0]}`} />
								</div>
							)}
						</div>
					)}
				/>
			);
		return null;
	};

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
