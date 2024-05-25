import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import { EmptyState } from '@/components/EmptyState';
import { Form } from '@/components/Form';
import { InviteMemberForm, InviteMemberSchema } from '@/components/InviteMemberForm';
import { useToast } from '@/hooks';
import useAuthorizeProject from '@/hooks/useAuthorizeProject';
import useClusterStore from '@/store/cluster/clusterStore';
import useProjectStore from '@/store/project/projectStore';
import { APIError } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { z } from 'zod';

export default function ProjectInviteMember() {
	const { t } = useTranslation();
	const { isInviteMemberModalOpen, closeInviteMemberModal, project, inviteUsersToProject } =
		useProjectStore();
	const { toast } = useToast();
	const { orgId } = useParams();
	const { canClusterSendEmail } = useClusterStore();
	const canInvite = useAuthorizeProject('invite.create');

	const form = useForm<z.infer<typeof InviteMemberSchema>>({
		resolver: zodResolver(InviteMemberSchema),
	});
	const { mutateAsync: inviteMutate, isPending } = useMutation({
		mutationFn: inviteUsersToProject,
		onSuccess: () => {
			toast({
				title: t('general.invitation.success') as string,
				action: 'success',
			});
			handleCloseDrawer();
		},
		onError: (err: APIError) => {
			if (err.fields === undefined) {
				toast({
					title: err.details,
					action: 'error',
				});
				return;
			}
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
			orgId,
			projectId: project?._id,
			members: data.member
				.filter((item) => item.email !== '' && item.role !== '')
				.map((member) => ({
					...member,
					uiBaseURL: window.location.origin,
				})),
			uiBaseURL: window.location.origin,
		});
	};

	function handleCloseDrawer() {
		form.reset();
		closeInviteMemberModal();
	}

	useEffect(() => {
		if (isInviteMemberModalOpen) {
			form.reset();
		}
	}, [isInviteMemberModalOpen]);

	return (
		<Drawer open={isInviteMemberModalOpen} onOpenChange={handleCloseDrawer}>
			<DrawerContent position='right' size='lg'>
				<DrawerHeader>
					<DrawerTitle>{t('project.invite.title')}</DrawerTitle>
				</DrawerHeader>
				<div className='p-6 space-y-6'>
					{canClusterSendEmail ? (
						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)}>
								<InviteMemberForm
									type='project'
									title={t('project.invite.subTitle') as string}
									description={t('project.invite.description') as string}
									loading={isPending}
									disabled={!canInvite}
								/>
							</form>
						</Form>
					) : (
						<EmptyState title={t('project.invite.email_disabled')} type='invitation'>
							<p className='text-subtle'>{t('project.invite.email_disabled')}</p>
							<Link to={`/profile/cluster-management`} className='text-blue-600 hover:underline'>
								{t('project.invite.configure')}
							</Link>
						</EmptyState>
					)}
				</div>
			</DrawerContent>
		</Drawer>
	);
}
