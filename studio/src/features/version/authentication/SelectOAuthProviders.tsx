import { Button } from '@/components/Button';
import { InfoModal } from '@/components/InfoModal';
import { SettingsFormItem } from '@/components/SettingsFormItem';
import { OAUTH_ICON_MAP } from '@/constants';
import { useAuthorizeVersion, useUpdateEffect } from '@/hooks';
import useTypeStore from '@/store/types/typeStore';
import useSettingsStore from '@/store/version/settingsStore';
import useVersionStore from '@/store/version/versionStore';
import { OAuthProvider, OAuthProviderTypes, VersionOAuthProvider } from '@/types';
import { capitalize } from '@/utils';
import { PencilSimple, Plus, Trash } from '@phosphor-icons/react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuItemContainer,
	DropdownMenuTrigger,
} from 'components/Dropdown';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AddProvider from './AddProvider';
import EditProvider from './EditProvider';

export default function SelectOAuthProviders() {
	const { t } = useTranslation();
	const canEdit = useAuthorizeVersion('version.auth.update');
	const { oAuthProviderTypes } = useTypeStore();
	const { deleteOAuthConfig } = useSettingsStore();
	const { version } = useVersionStore();
	const [selectedProvider, setSelectedProvider] = useState<OAuthProvider | null>();
	const [toDeleteProvider, setToDeleteProvider] = useState<VersionOAuthProvider | null>();
	const [editedProvider, setEditedProvider] = useState<VersionOAuthProvider | null>();

	function getIcon(provider: OAuthProviderTypes): JSX.Element {
		const Icon = OAUTH_ICON_MAP[provider];
		return <Icon className='size-3.5' />;
	}
	function handleDeleteOAuthConfig() {
		deleteOAuthConfig({
			versionId: version._id,
			providerId: toDeleteProvider?._id as string,
			orgId: version.orgId,
			appId: version.appId,
			onSuccess: () => {
				setToDeleteProvider(null);
			},
		});
	}

	const providers = useMemo(() => {
		return oAuthProviderTypes.filter((type) => {
			return !version.authentication.providers.find((p) => p.provider === type.provider);
		});
	}, [version.authentication.providers]);

	useUpdateEffect(() => {
		if (version) {
			setSelectedProvider(null);
			setToDeleteProvider(null);
			setEditedProvider(null);
		}
	}, [version]);
	return (
		<SettingsFormItem
			className='py-0 !max-w-lg'
			contentClassName='p-4 border border-border rounded-lg space-y-4'
			title={t('version.authentication.auth_providers')}
			description={t('version.authentication.auth_providers_desc')}
		>
			<div className='flex items-center justify-between'>
				<p className='text-subtle text-xs font-sfCompact'>
					{t('version.authentication.providers')}
				</p>
				<DropdownMenu>
					<DropdownMenuTrigger asChild disabled={!providers.length || !canEdit}>
						<Button variant='secondary'>
							<Plus className='mr-2' />
							{t('version.authentication.add_auth_provider')}
						</Button>
					</DropdownMenuTrigger>

					<DropdownMenuContent align='end' className='version-dropdown-content'>
						<DropdownMenuItemContainer className='space-y-2'>
							{providers.map((p) => (
								<DropdownMenuItem
									key={p.provider}
									className='flex items-center gap-2'
									onClick={() => {
										setSelectedProvider(p);
									}}
								>
									{getIcon(p.provider)}
									<span className='font-sfCompact text-default text-xs'>
										{capitalize(p.provider)}
									</span>
								</DropdownMenuItem>
							))}
						</DropdownMenuItemContainer>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<div className='space-y-4'>
				{version.authentication.providers.length ? (
					version.authentication.providers.map((p) => (
						<div
							className='flex justify-between items-center py-1 px-2 rounded-lg group border border-border'
							key={p._id}
						>
							<div className='flex gap-2'>
								{getIcon(p.provider)}
								<p className='font-sfCompact text-default text-xs'>{capitalize(p.provider)}</p>
							</div>
							<div className='invisible group-hover:visible'>
								<Button
									variant='icon'
									rounded
									size='sm'
									onClick={() => setEditedProvider(p)}
									disabled={!canEdit}
								>
									<PencilSimple size={18} className='text-subtle' />
								</Button>
								<Button
									variant='icon'
									rounded
									size='sm'
									onClick={() => setToDeleteProvider(p)}
									disabled={!canEdit}
								>
									<Trash size={18} className='text-subtle' />
								</Button>
							</div>
						</div>
					))
				) : (
					<p className='text-subtle font-sfCompact text-center text-xs'>
						{t('version.authentication.no_providers')}
					</p>
				)}
			</div>
			<AddProvider
				open={Boolean(selectedProvider)}
				provider={selectedProvider as OAuthProvider}
				onClose={() => setSelectedProvider(null)}
			/>
			<EditProvider
				open={Boolean(editedProvider)}
				editedProvider={editedProvider as VersionOAuthProvider}
				onClose={() => setEditedProvider(null)}
			/>
			<InfoModal
				isOpen={Boolean(toDeleteProvider)}
				closeModal={() => setToDeleteProvider(null)}
				title={t('general.singleDelete')}
				description={t('general.deleteDescription')}
				onConfirm={handleDeleteOAuthConfig}
			/>
		</SettingsFormItem>
	);
}
