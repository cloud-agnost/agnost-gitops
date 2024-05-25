import { useTranslation } from 'react-i18next';
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from 'components/Drawer';
import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ADD_API_KEYS_MENU_ITEMS } from '@/constants';
import { OrganizationMenuItem } from '@/features/organization';
import {
	AddOrEditAPIKeyAllowedDomains,
	AddOrEditAPIKeyAllowedIPs,
	AddOrEditAPIKeyGeneral,
	Schema,
} from '@/features/version/SettingsAPIKeys/';
import { AnimatePresence } from 'framer-motion';
import { FormProvider, useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import useVersionStore from '@/store/version/versionStore.ts';
import { Button } from '@/components/Button';
import { APIKey, CreateAPIKeyParams, Endpoint, UpdateAPIKeyParams } from '@/types';
import useEndpointStore from '@/store/endpoint/endpointStore.ts';
import useSettingsStore from '@/store/version/settingsStore';
import { useMutation } from '@tanstack/react-query';
import { toast } from '@/hooks/useToast';

interface AddAPIKeyDrawerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editMode?: boolean;
}

export default function AddOrEditAPIKeyDrawer({
	open,
	onOpenChange,
	editMode = false,
}: AddAPIKeyDrawerProps) {
	const { t } = useTranslation();
	const [searchParams, setSearchParams] = useSearchParams();
	const { createAPIKey, editAPIKey, selectedAPIKey, setSelectedAPIKey } = useSettingsStore();
	const { version } = useVersionStore();
	const { getEndpointsByIid } = useEndpointStore();
	const [_, setEndpoints] = useState<Endpoint[]>([]);

	const form = useForm<z.infer<typeof Schema>>({
		resolver: zodResolver(Schema),
		defaultValues: {
			ip: {
				type: 'all',
				list: [{ ip: '' }],
			},
			domain: {
				type: 'all',
				list: [{ domain: '' }],
			},
			general: {
				realtime: false,
				name: '',
				expiryDate: undefined,
				endpoint: {
					type: editMode ? selectedAPIKey?.type : 'no-access',
					allowedEndpoints: [{ url: '' }],
					excludedEndpoints: [{ url: '' }],
				},
			},
		},
	});

	useEffect(() => {
		if (!open) {
			searchParams.delete('t');
			setSearchParams(searchParams);
			//form.reset();
		} else if (!searchParams.has('t')) {
			searchParams.set('t', 'general');
			setSearchParams(searchParams);
		}
	}, [open]);

	useEffect(() => {
		setDefaultForEdit();
	}, [open, selectedAPIKey]);

	async function setDefaultForEdit() {
		if (open && selectedAPIKey) {
			form.setValue('ip.type', selectedAPIKey.IPAuthorization);
			form.setValue(
				'ip.list',
				selectedAPIKey?.authorizedIPs?.map((ip) => ({ ip })) ?? [{ ip: '' }],
			);
			form.setValue('domain.type', selectedAPIKey.domainAuthorization);
			form.setValue(
				'domain.list',
				selectedAPIKey?.authorizedDomains.map((domain) => ({ domain })) ?? [{ domain: '' }],
			);
			form.setValue('general.realtime', selectedAPIKey.allowRealtime);
			form.setValue('general.name', selectedAPIKey.name);
			form.setValue(
				'general.expiryDate',
				selectedAPIKey.expiryDate ? new Date(selectedAPIKey.expiryDate) : undefined,
			);
			form.setValue('general.endpoint.type', selectedAPIKey.type);
			form.setValue(
				'general.endpoint.allowedEndpoints',
				selectedAPIKey?.allowedEndpoints.map((url) => ({ url })) ?? [{ url: '' }],
			);
			form.setValue(
				'general.endpoint.excludedEndpoints',
				selectedAPIKey?.excludedEndpoints.map((url) => ({ url })) ?? [{ url: '' }],
			);
			if (!version) return;

			const iids = (
				selectedAPIKey.type === 'custom-excluded'
					? selectedAPIKey.excludedEndpoints
					: selectedAPIKey.allowedEndpoints
			).map((url) => url);

			const endpoints = await getEndpointsByIid({
				orgId: version.orgId,
				appId: version.appId,
				versionId: version._id,
				iids,
			});

			setEndpoints(endpoints);
		}
	}

	const activeTab = searchParams.get('t') || 'general';

	const tabs: Record<string, ReactNode> = {
		general: <AddOrEditAPIKeyGeneral setEndpoints={setEndpoints} />,
		'allowed-domains': <AddOrEditAPIKeyAllowedDomains />,
		'allowed-ips': <AddOrEditAPIKeyAllowedIPs />,
	};

	const tabHasError: Record<string, string> = {
		ip: 'allowed-ips',
		domain: 'allowed-domains',
		general: 'general',
	};

	const tabToError: Record<string, string> = {
		'allowed-ips': 'ip',
		'allowed-domains': 'domain',
		general: 'general',
	};
	const { mutateAsync, isPending } = useMutation({
		mutationFn: editMode ? editAPIKey : createAPIKey,
		onSuccess: () => {
			handleOnOpenChange(false);
			if (editMode) {
				toast({
					action: 'success',
					title: t('version.api_key.update_success') as string,
				});
			}
		},
	});
	async function onSubmit(data: z.infer<typeof Schema>) {
		if (!version) return;
		const dataToAPI: UpdateAPIKeyParams & CreateAPIKeyParams = {
			keyId: '',
			orgId: version.orgId,
			appId: version.appId,
			versionId: version._id,
			name: data.general.name,
			type: data.general.endpoint.type,
			IPAuthorization: data.ip.type,
			domainAuthorization: data.domain.type,
			expiryDate: data.general.expiryDate,
			allowedEndpoints:
				data.general.endpoint.type === 'custom-allowed'
					? (data.general.endpoint.allowedEndpoints
							.map((endpoint) => endpoint.url)
							.filter(Boolean) as string[])
					: undefined,
			allowRealtime: data.general.realtime,
			excludedEndpoints:
				data.general.endpoint.type === 'custom-excluded'
					? (data.general.endpoint.excludedEndpoints
							.map((endpoint) => endpoint.url)
							.filter(Boolean) as string[])
					: undefined,
			authorizedDomains:
				data.domain.type === 'specified'
					? (data.domain.list.map((item) => item.domain).filter(Boolean) as string[])
					: undefined,
			authorizedIPs:
				data.ip.type === 'specified'
					? (data.ip.list.map((item) => item.ip).filter(Boolean) as string[])
					: undefined,
		};
		if (editMode && selectedAPIKey) {
			dataToAPI.keyId = selectedAPIKey?._id;
		}

		await mutateAsync(dataToAPI);
	}

	function bindOnSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		form.handleSubmit(onSubmit)(event);

		const error = tabToError[activeTab];
		const errorKeys = Object.keys(form.formState.errors);
		const activeTabHasError = errorKeys.includes(error);
		const lastError = errorKeys[errorKeys.length - 1];

		if (!activeTabHasError && lastError) {
			searchParams.set('t', tabHasError[lastError]);
			setSearchParams(searchParams);
		}
	}

	function handleOnOpenChange(status: boolean) {
		onOpenChange(status);
		form.reset();
		if (!status) {
			setSelectedAPIKey({} as APIKey);
		}
	}

	return (
		<FormProvider {...form}>
			<Drawer open={open} onOpenChange={handleOnOpenChange}>
				<DrawerContent position='right' className='overflow-auto'>
					<DrawerHeader className='border-none'>
						<DrawerTitle>
							{editMode ? t('version.api_key.edit') : t('version.api_key.add')}
						</DrawerTitle>
					</DrawerHeader>
					<ul className='flex border-b'>
						{ADD_API_KEYS_MENU_ITEMS.map((item) => {
							return (
								<OrganizationMenuItem
									key={item.name}
									item={item}
									active={window.location.search.includes(item.href)}
								/>
							);
						})}
					</ul>
					<form onSubmit={bindOnSubmit}>
						<AnimatePresence>{tabs[activeTab]}</AnimatePresence>
						<div className='flex gap-4 justify-end border-none p-6 !pt-0'>
							<DrawerClose asChild>
								<Button variant='secondary' size='lg'>
									{t('general.cancel')}
								</Button>
							</DrawerClose>
							<Button size='lg' loading={isPending} type='submit'>
								{t('general.save')}
							</Button>
						</div>
					</form>
				</DrawerContent>
			</Drawer>
		</FormProvider>
	);
}
