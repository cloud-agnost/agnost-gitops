import { Button } from '@/components/Button';
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from '@/components/Drawer';
import { Form } from '@/components/Form';
import { InviteMemberForm, InviteMemberSchema } from '@/components/InviteMemberForm';
import useAuthorizeOrg from '@/hooks/useAuthorizeOrg';
import useOrganizationStore from '@/store/organization/organizationStore';
import { cn } from '@/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { DialogProps } from '@radix-ui/react-dialog';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { z } from 'zod';

export default function InviteOrganization({
	dropdown,
	open,
	onOpenChange,
}: { dropdown?: boolean } & DialogProps) {
	const canInvite = useAuthorizeOrg('invite.create');
	const [searchParams, setSearchParams] = useSearchParams();
	const { t } = useTranslation();

	const { inviteUsersToOrganization, organization, toggleOrganizationSettings } =
		useOrganizationStore();
	const form = useForm<z.infer<typeof InviteMemberSchema>>({
		resolver: zodResolver(InviteMemberSchema),
	});
	const { mutateAsync: inviteMutate, isPending } = useMutation({
		mutationFn: inviteUsersToOrganization,
		onSuccess: () => {
			setSearchParams({ ot: 'invitations' });
			form.reset({
				member: [
					{
						name: '',
						role: '',
					},
				],
			});
			searchParams.set('ot', 'invitations');
			setSearchParams(searchParams);
			document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
			toggleOrganizationSettings();
		},
		onError: (err) => {
			err.fields?.forEach((field) => {
				form.setError(`member.${field.param.replace(/\[|\]/g, '')}` as any, {
					type: 'custom',
					message: field.msg,
				});
			});
		},
	});
	const onSubmit = (data: z.infer<typeof InviteMemberSchema>) => {
		inviteMutate({
			organizationId: organization?._id as string,
			members: data.member.filter((item) => item.role !== '') as any,
			uiBaseURL: window.location.origin,
		});
	};

	return (
		<Drawer open={open} onOpenChange={onOpenChange}>
			{!dropdown && (
				<DrawerTrigger asChild>
					<Button
						size={dropdown ? 'full' : 'md'}
						variant={dropdown ? 'blank' : 'primary'}
						className={cn(dropdown && 'justify-start dropdown-item')}
					>
						{t('general.addMembers')}
					</Button>
				</DrawerTrigger>
			)}
			<DrawerContent position='right' size='lg'>
				<DrawerHeader>
					<DrawerTitle>{t('organization.settings.members.invite.title')}</DrawerTitle>
				</DrawerHeader>
				<div className='p-6 space-y-6'>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)}>
							<InviteMemberForm
								loading={isPending}
								type='org'
								title={t('organization.settings.members.invite.title') as string}
								description={t('organization.settings.members.invite.desc') as string}
								disabled={!canInvite}
							/>
						</form>
					</Form>
				</div>
			</DrawerContent>
		</Drawer>
	);
}
