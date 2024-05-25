import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { InviteMemberForm, InviteMemberSchema } from '@/components/InviteMemberForm';
import { RequireAuth } from '@/router';
import useClusterStore from '@/store/cluster/clusterStore';
import useOnboardingStore from '@/store/onboarding/onboardingStore';
import useTypeStore from '@/store/types/typeStore';
import { APIError } from '@/types/type';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { z } from 'zod';

export default function InviteTeamMembers() {
	const { goBack } = useOutletContext() as { goBack: () => void };
	const { setStepByPath, setDataPartially, data: onboardingReq } = useOnboardingStore();
	const { finalizeClusterSetup } = useClusterStore();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { getAllTypes } = useTypeStore();
	const form = useForm<z.infer<typeof InviteMemberSchema>>({
		resolver: zodResolver(InviteMemberSchema),
	});
	const { mutateAsync: inviteMutate, isPending } = useMutation({
		mutationFn: finalizeClusterSetup,
		onSuccess: (res) => {
			setStepByPath('/onboarding/invite-team-members', {
				isDone: true,
			});
			navigate(`/organization/${res.org._id}/apps`);
		},
		onError: (err: APIError) => {
			err.fields?.forEach((field) => {
				form.setError(`member.${field.param.replace(/\[|\]/g, '')}` as any, {
					type: 'custom',
					message: field.msg,
				});
			});
		},
	});

	function onSubmit(data: z.infer<typeof InviteMemberSchema>) {
		const appMembers = data.member.map((m) => ({
			...m,
			role: m.role as any,
		}));
		setDataPartially({
			appMembers,
		});
		inviteMutate({
			...onboardingReq,
			uiBaseURL: window.location.origin,
			appMembers,
		});
	}

	useEffect(() => {
		getAllTypes();
	}, []);

	return (
		<RequireAuth>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<InviteMemberForm
						title={t('onboarding.invite.title') as string}
						description={t('onboarding.invite.desc') as string}
						type='app'
						loading={isPending}
						actions={
							<Button variant='text' size='lg' onClick={goBack}>
								{t('onboarding.previous')}
							</Button>
						}
					/>
				</form>
			</Form>
		</RequireAuth>
	);
}
