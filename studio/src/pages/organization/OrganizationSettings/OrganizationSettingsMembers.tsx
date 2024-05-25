import {
	OrganizationInvitation,
	OrganizationInvitationTable,
	OrganizationMembersTable,
} from '@/features/organization';
import { SettingsContainer } from '@/features/version/SettingsContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'components/Tabs';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import '../organization.scss';
export default function OrganizationSettingsMembers() {
	const { t } = useTranslation();
	const [searchParams, setSearchParams] = useSearchParams();

	useEffect(() => {
		if (!searchParams.has('tab')) {
			searchParams.set('tab', 'member');
			setSearchParams(searchParams);
		}
	}, []);

	return (
		<SettingsContainer
			pageTitle={t('organization.settings.members.title')}
			description={t('organization.settings.members.description')}
		>
			<OrganizationInvitation />
			<div className='members'>
				<Tabs
					value={searchParams.get('tab') as string}
					onValueChange={(value) => {
						searchParams.set('tab', value);
						searchParams.delete('q');
						searchParams.delete('s');
						searchParams.delete('d');
						searchParams.delete('r');
						setSearchParams(searchParams);
					}}
					className='relative'
				>
					<TabsList containerClassName='absolute -top-6 xs:relative z-10'>
						<TabsTrigger value='member'>{t('organization.settings.members.title')}</TabsTrigger>
						<TabsTrigger value='invitation'>
							{t('organization.settings.pending-invitation')}
						</TabsTrigger>
					</TabsList>

					<TabsContent value='member'>
						<OrganizationMembersTable />
					</TabsContent>
					<TabsContent value='invitation'>
						<OrganizationInvitationTable />
					</TabsContent>
				</Tabs>
			</div>
		</SettingsContainer>
	);
}
