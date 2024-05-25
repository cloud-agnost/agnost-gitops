import { Button } from '@/components/Button';
import { useToast } from '@/hooks';
import useResourceStore from '@/store/resources/resourceStore';
import { APIError } from '@/types';
import { ShareNetwork } from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
export default function TestConnectionButton({ replica }: { replica?: boolean }) {
	const { t } = useTranslation();
	const form = useFormContext();
	const { toast } = useToast();
	const { testExistingResourceConnection, resourceConfig } = useResourceStore();
	const { orgId } = useParams() as Record<string, string>;
	const { mutateAsync: testMutate, isPending } = useMutation({
		mutationFn: testExistingResourceConnection,
		onSuccess: () => {
			toast({
				title: t('resources.database.test_success') as string,
				action: 'success',
			});
		},
		onError: ({ details }: APIError) => {
			toast({
				title: details,
				action: 'error',
			});
		},
	});

	async function testResourceConnection() {
		const data = form.getValues();
		const options = replica ? data.options : data.access.options;
		const access = replica ? data : data.access;
		const isValid = await form.trigger(replica ? undefined : 'access');

		if (!isValid) return;
		testMutate({
			orgId,
			...data,
			access: {
				...access,
				options: options?.filter((option: any) => option.key && option.value),
				...(replica && {
					brokers: data.brokers?.map((broker: any) => broker.key) as string[],
				}),
			},
			type: resourceConfig.resourceType,
			instance: resourceConfig.instance,
			allowedRoles: form.getValues('allowedRoles'),
		});
	}
	return (
		<Button
			variant='outline'
			loading={isPending}
			onClick={testResourceConnection}
			size='lg'
			className='self-start'
			type='button'
		>
			{!isPending && <ShareNetwork className='w-4 h-4 text-icon-default mr-2' />}
			{t('resources.database.test')}
		</Button>
	);
}
