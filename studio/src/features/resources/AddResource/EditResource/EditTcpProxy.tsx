import { Button } from '@/components/Button';
import { CopyInput } from '@/components/CopyInput';
import { Description } from '@/components/Description';
import { Label } from '@/components/Label';
import { PasswordInput } from '@/components/PasswordInput';
import { useToast, useUpdateEffect } from '@/hooks';
import useResourceStore from '@/store/resources/resourceStore';
import { ResourceInstances } from '@/types';
import { ArrowRight } from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import _ from 'lodash';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

export default function EditTcpProxy() {
	const { enableTcpProxy, disableTcpProxy, resourceToEdit } = useResourceStore();
	const [isButtonDisabled, setIsButtonDisabled] = useState(false);
	const { toast } = useToast();
	const { t } = useTranslation();
	const { orgId } = useParams() as Record<string, string>;
	const { isPending: enableLoading, mutate: enableTcpProxyMutate } = useMutation({
		mutationFn: () => enableTcpProxy({ resourceId: resourceToEdit._id, orgId }),
		mutationKey: ['enableTcpProxy'],
		onSuccess: () => {
			toast({
				title: t('resources.enable_networking_success') as string,
				action: 'success',
			});
		},
	});

	const { isPending: disableLoading, mutate: disableTcpProxyMutate } = useMutation({
		mutationFn: () => disableTcpProxy({ resourceId: resourceToEdit._id, orgId }),
		mutationKey: ['disableTcpProxy'],
		onSuccess: () => {
			toast({
				title: t('resources.disable_networking_success') as string,
				action: 'success',
			});
		},
	});

	useUpdateEffect(() => {
		setIsButtonDisabled(true);
		const timer = setTimeout(
			() => {
				setIsButtonDisabled(false);
			},
			Number(import.meta.env.VITE_EDIT_PROXY_TIMEOUT),
		);
		return () => clearTimeout(timer);
	}, [resourceToEdit.updatedAt]);

	return (
		<div className='space-y-4'>
			<Description title={t('resources.private_networking')}>
				{t('resources.private_networking_description')}
			</Description>
			<div className='space-y-4'>
				{!_.isEmpty(resourceToEdit?.accessReadOnly) && (
					<Label className='description-title'>{t('resources.primary')}</Label>
				)}
				<div className='space-y-4'>
					{resourceToEdit?.access && (
						<div className='space-y-4'>
							<div className='flex gap-6'>
								<div className='flex-1'>
									<Label>{t('resources.database.host')}</Label>
									<CopyInput readOnly value={resourceToEdit?.access.host} />
								</div>
								<div>
									<Label>{t('resources.database.port')}</Label>
									<CopyInput readOnly value={resourceToEdit?.access.port} />
								</div>
							</div>
							<div className='flex items-start gap-6'>
								{resourceToEdit?.access.username && (
									<div className='flex-1'>
										<Label>{t('resources.database.username')}</Label>
										<PasswordInput readOnly value={resourceToEdit?.access.username} copyable />
									</div>
								)}
								<div className='flex-1'>
									<Label>{t('resources.database.password')}</Label>
									<PasswordInput readOnly value={resourceToEdit?.access.password} copyable />
								</div>
							</div>
							{resourceToEdit.instance === ResourceInstances.RabbitMQ && (
								<div className='flex items-start gap-6'>
									<div className='flex-1'>
										<Label>{t('resources.queue.scheme')}</Label>
										<CopyInput readOnly value={resourceToEdit?.access.scheme} />
									</div>

									<div className='flex-1'>
										<Label>{t('resources.queue.vhost')}</Label>
										<CopyInput readOnly value={resourceToEdit?.access.vhost} />
									</div>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
			{!_.isEmpty(resourceToEdit?.accessReadOnly) && (
				<div className='space-y-4'>
					<Label className='description-title'>{t('resources.replicas')}</Label>
					{resourceToEdit.accessReadOnly?.map((replica) => (
						<>
							<div className='flex gap-6'>
								<div className='flex-1'>
									<Label>{t('resources.database.host')}</Label>
									<CopyInput readOnly value={replica.host} />
								</div>
								<div>
									<Label>{t('resources.database.port')}</Label>
									<CopyInput readOnly value={replica.port} />
								</div>
							</div>
							<div className='flex items-start gap-6'>
								{replica.username && (
									<div className='flex-1'>
										<Label>{t('resources.database.username')}</Label>
										<PasswordInput readOnly value={replica.username} copyable />
									</div>
								)}
								<div className='flex-1'>
									<Label>{t('resources.database.password')}</Label>
									<PasswordInput readOnly value={replica.password} copyable />
								</div>
							</div>
						</>
					))}
				</div>
			)}
			<div className='space-y-4'>
				<Description title={t('resources.public_networking')}>
					{t('resources.public_networking_description')}
				</Description>
				{resourceToEdit.tcpProxyEnabled && (
					<div className='flex items-center gap-4'>
						<CopyInput
							className='flex-1'
							readOnly
							value={`${window.location.hostname}:${resourceToEdit.tcpProxyPort}`}
						/>
						<ArrowRight />
						<CopyInput className='flex-1' readOnly value={resourceToEdit?.access?.host} />
					</div>
				)}
			</div>
			<Button
				className='self-end'
				onClick={resourceToEdit.tcpProxyEnabled ? disableTcpProxyMutate : enableTcpProxyMutate}
				loading={enableLoading || disableLoading}
				disabled={isButtonDisabled}
			>
				{t(`resources.${resourceToEdit.tcpProxyEnabled ? 'disable' : 'enable'}_networking`)}
			</Button>
		</div>
	);
}
