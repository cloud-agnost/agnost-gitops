import { EmptyState } from '@/components/EmptyState';
import { Form } from '@/components/Form';
import { InviteMemberForm, InviteMemberSchema } from '@/components/InviteMemberForm';
import { Separator } from '@/components/Separator';
import { useToast } from '@/hooks';
import useAuthorizeOrg from '@/hooks/useAuthorizeOrg';
import useClusterStore from '@/store/cluster/clusterStore';
import useOrganizationStore from '@/store/organization/organizationStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { z } from 'zod';

export default function OrganizationInvitation() {
	const { canClusterSendEmail } = useClusterStore();
	const canInvite = useAuthorizeOrg('invite.create');
	const { toast } = useToast();
	const { t } = useTranslation();

	const { inviteUsersToOrganization, organization } = useOrganizationStore();
	const form = useForm<z.infer<typeof InviteMemberSchema>>({
		resolver: zodResolver(InviteMemberSchema),
	});
	const { mutateAsync: inviteMutate, isPending } = useMutation({
		mutationFn: inviteUsersToOrganization,
		onSuccess: () => {
			toast({
				title: t('general.invitation.success') as string,
				action: 'success',
			});
			form.reset({
				member: [
					{
						email: '',
						role: '',
					},
				],
			});
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
			members: data.member.filter((item) => item.email !== '' && item.role !== '') as any,
			uiBaseURL: window.location.origin,
		});
	};

	return canClusterSendEmail ? (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				<InviteMemberForm
					loading={isPending}
					type='org'
					title={t('organization.settings.members.invite.title') as string}
					description={t('organization.settings.members.invite.desc') as string}
					disabled={!canInvite}
				/>
				<Separator className='my-12' />
			</form>
		</Form>
	) : (
		<EmptyState title={t('application.invite_member.email_disabled')} type='invitation'>
			<p className='text-subtle'>{t('application.invite_member.email_disabled')}</p>
			<Link
				to={`/organization/${organization?._id}/profile/cluster-management`}
				className='text-blue-600 hover:underline'
			>
				{t('application.invite_member.configure')}
			</Link>
		</EmptyState>
	);
}
