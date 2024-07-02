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
import { useToast } from '@/hooks';
import useAuthorizeOrg from '@/hooks/useAuthorizeOrg';
import useOrganizationStore from '@/store/organization/organizationStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

export default function InviteOrganization({ dropdown }: { dropdown?: boolean }) {
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
			document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
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

	return (
		<Drawer>
			<DrawerTrigger asChild>
				<div className='px-2 py-1.5 hover:bg-lighter'>
					<Button size={dropdown ? 'full' : 'md'} variant={dropdown ? 'text' : 'primary'}>
						{t('general.addMembers')}
					</Button>
				</div>
			</DrawerTrigger>
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
