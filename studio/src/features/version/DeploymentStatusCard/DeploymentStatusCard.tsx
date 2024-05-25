import { Button } from '@/components/Button';
import { ENV_STATUS_CLASS_MAP } from '@/constants';
import {
	DeploymentLogsDrawer,
	LastDeployment,
	Resources,
} from '@/features/version/DeploymentStatusCard/index.ts';
import { useAuthorizeVersion, useEnvironmentStatus, useToast } from '@/hooks';
import useEnvironmentStore from '@/store/environment/environmentStore';
import { APIError, EnvironmentStatus, ResourceCreateType } from '@/types';
import { cn } from '@/utils';
import { ArrowClockwise, Cloud } from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItemContainer,
	DropdownMenuLabel,
	DropdownMenuTrigger,
	DropdownMenuItem,
	DropdownMenuSeparator,
} from 'components/Dropdown';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './deploymentStatusCard.scss';
import { useParams } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/Tooltip';
import { Alert, AlertTitle } from '@/components/Alert';
import useResourceStore from '@/store/resources/resourceStore';

export default function DeploymentStatusCard() {
	const { t } = useTranslation();
	const [isLogsOpen, setIsLogsOpen] = useState(false);
	const canDeploy = useAuthorizeVersion('env.deploy');
	const {
		getEnvironmentResources,
		environment,
		redeployAppVersionToEnvironment,
		getAppVersionEnvironment,
	} = useEnvironmentStore();
	const { openSelectResourceTypeModal } = useResourceStore();
	const envStatus = useEnvironmentStatus();
	const classes = ENV_STATUS_CLASS_MAP[envStatus as EnvironmentStatus];
	const { toast } = useToast();
	const { versionId, appId, orgId } = useParams<{
		versionId: string;
		appId: string;
		orgId: string;
	}>();
	function handleOpenChange(open: boolean) {
		if (open) {
			getEnvironmentResources({
				orgId: environment?.orgId,
				appId: environment?.appId,
				envId: environment?._id,
				versionId: environment?.versionId,
			});
			getAppVersionEnvironment({
				orgId: orgId as string,
				versionId: versionId as string,
				appId: appId as string,
			});
		}
	}
	const { mutateAsync: redeployMutate, isPending } = useMutation({
		mutationFn: redeployAppVersionToEnvironment,
		onError: (error: APIError) => {
			toast({
				action: 'error',
				title: error.details,
			});
		},
	});
	async function redeploy() {
		if (!versionId || !appId || !orgId || !environment) return;
		redeployMutate({
			orgId,
			appId,
			versionId,
			envId: environment._id,
		});
	}
	return (
		<>
			<DropdownMenu onOpenChange={(open) => handleOpenChange(open)}>
				<DropdownMenuTrigger asChild>
					<Button variant='icon' size='sm' rounded className='relative'>
						<div className='absolute top-1.5 right-1'>
							<span className='relative flex items-center justify-center h-2.5 w-2.5'>
								<span
									className={cn(
										'ping absolute inline-flex h-full w-full rounded-full ',
										classes?.[0],
									)}
								/>
								<span className={cn('relative inline-flex rounded-full h-2 w-2', classes?.[1])} />
							</span>
						</div>
						<Cloud size={18} />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className='overflow-hidden relative w-[21rem]' align='end'>
					<DropdownMenuLabel className='relative flex justify-between items-center px-4 py-2'>
						<span className='truncate text-default'>{t('version.deployment_status')}</span>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										onClick={redeploy}
										variant='icon'
										size='sm'
										rounded
										disabled={envStatus === EnvironmentStatus.Deploying || !canDeploy}
									>
										<ArrowClockwise
											className={cn(
												'w-5 h-5 text-icon-secondary',
												(isPending || envStatus === EnvironmentStatus.Deploying) && 'animate-spin',
											)}
										/>
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									{envStatus === EnvironmentStatus.Deploying
										? t('version.deploying')
										: t('version.redeploy')}
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</DropdownMenuLabel>
					{environment.suspended && (
						<Alert variant='warning' size='sm'>
							<AlertTitle className='font-normal'>{t('version.suspended_desc')}</AlertTitle>
						</Alert>
					)}
					<div className='deployment-status-content'>
						<LastDeployment />
						<Resources />
					</div>

					<DropdownMenuItemContainer>
						<DropdownMenuSeparator className='!m-0' />
						<DropdownMenuItem onClick={() => setIsLogsOpen(true)}>
							{t('version.view_logs')}
						</DropdownMenuItem>
						<DropdownMenuSeparator className='!m-0' />
						<DropdownMenuItem onClick={() => openSelectResourceTypeModal(ResourceCreateType.New)}>
							Add New Resource
						</DropdownMenuItem>
						<DropdownMenuSeparator className='!m-0' />
						<DropdownMenuItem
							onClick={() => openSelectResourceTypeModal(ResourceCreateType.Existing)}
						>
							Connect Existing Resource
						</DropdownMenuItem>
					</DropdownMenuItemContainer>
				</DropdownMenuContent>
			</DropdownMenu>
			<DeploymentLogsDrawer open={isLogsOpen} onOpenChange={setIsLogsOpen} />
		</>
	);
}
