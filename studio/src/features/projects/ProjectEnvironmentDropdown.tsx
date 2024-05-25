import { Button } from '@/components/Button';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import useProjectEnvironmentDropdown from '@/hooks/useProjectEnvironmentDropdown';
import { useToast } from '@/hooks/useToast';
import useProjectEnvironmentStore from '@/store/project/projectEnvironmentStore';
import useProjectStore from '@/store/project/projectStore';
import { APIError } from '@/types';
import { CaretUpDown, LockSimple, LockSimpleOpen } from '@phosphor-icons/react';
import { useMutation } from '@tanstack/react-query';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuItemContainer,
	DropdownMenuTrigger,
} from 'components/Dropdown';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
export default function ProjectEnvironmentDropdown() {
	const {
		environment,
		deleteEnvironment,
		isDeleteEnvironmentModalOpen,
		toggleDeleteEnvironmentModal,
	} = useProjectEnvironmentStore();
	const { toast } = useToast();
	const { orgId, projectId, envId } = useParams() as Record<string, string>;
	const navigate = useNavigate();
	const { openEnvironmentDrawer, project } = useProjectStore();
	const { t } = useTranslation();
	const envDropdownItems = useProjectEnvironmentDropdown();

	const {
		mutate: deleteEnvironmentHandler,
		isPending,
		error,
	} = useMutation({
		mutationFn: () =>
			deleteEnvironment({
				projectId,
				orgId,
				envId,
			}),

		onSuccess: () => {
			toggleDeleteEnvironmentModal();
			navigate(`/organization/${orgId}/projects`);
			openEnvironmentDrawer(project);
		},
		onError: (error: APIError) => {
			toast({
				action: 'error',
				title: error.details,
			});
		},
	});

	return (
		<>
			<ConfirmationModal
				loading={isPending}
				error={error}
				title={t('project.delete_env.title')}
				alertTitle={t('project.delete_env.alert_title')}
				alertDescription={t('project.delete_env.alert_desc')}
				description={
					<Trans
						i18nKey='project.delete_env.confirm_description'
						values={{ confirmCode: environment.iid }}
						components={{
							confirmCode: <span className='font-bold text-default' />,
						}}
					/>
				}
				confirmCode={environment.iid}
				onConfirm={deleteEnvironmentHandler}
				isOpen={isDeleteEnvironmentModalOpen}
				closeModal={toggleDeleteEnvironmentModal}
				closable
			/>
			<DropdownMenu>
				<div className='w-[210px] h-10 relative rounded-sm overflow-hidden flex items-center'>
					<Button
						variant='blank'
						className='flex items-center px-1.5 h-full w-full hover:bg-wrapper-background-hover transition font-normal rounded-sm'
					>
						<div className='w-7 h-7 bg-subtle flex items-center justify-center rounded p-[6px] text-icon-base mr-2'>
							{environment?.readOnly ? (
								<LockSimple size={20} className='text-elements-red' />
							) : (
								<LockSimpleOpen size={20} className='text-elements-green' />
							)}
						</div>
						<div className='text-left flex-1 font-sfCompact h-full flex flex-col justify-center'>
							<div className=' text-xs leading-none text-default whitespace-nowrap truncate max-w-[12ch]'>
								{environment?.name}
							</div>
							<div className='text-xs text-subtle'>
								{environment?.readOnly ? 'Read Only' : 'Read/Write'}
							</div>
						</div>
					</Button>
					<DropdownMenuTrigger asChild>
						<Button
							variant='icon'
							className='absolute z-50 top-1 right-0 text-icon-base p-1.5'
							rounded
							size='sm'
						>
							<CaretUpDown size={20} />
						</Button>
					</DropdownMenuTrigger>
				</div>

				<DropdownMenuContent align='end' className='min-w-[210px] mt-1.5'>
					<DropdownMenuItemContainer>
						{envDropdownItems.map((option) => (
							<DropdownMenuItem
								onClick={option.action}
								key={option.title}
								disabled={option.disabled}
							>
								<option.icon className='w-5 h-5 mr-2' />
								{option.title}
							</DropdownMenuItem>
						))}
					</DropdownMenuItemContainer>
				</DropdownMenuContent>
			</DropdownMenu>
		</>
	);
}
