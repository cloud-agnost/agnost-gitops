import useProjectEnvironmentStore from '@/store/project/projectEnvironmentStore';
import useProjectStore from '@/store/project/projectStore';
import { APIError, UpdateEnvironmentRequest } from '@/types';
import { Eye, EyeSlash, GitBranch, LockSimple, Plus, Trash } from '@phosphor-icons/react';
import { LockSimpleOpen } from '@phosphor-icons/react/dist/ssr';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useToast } from './useToast';
export default function useProjectEnvironmentDropdown() {
	const { t } = useTranslation();
	const { toast } = useToast();
	const { projectId, orgId, envId } = useParams() as Record<string, string>;
	const { openEnvironmentDrawer, project } = useProjectStore();
	const {
		environments,
		environment,
		getProjectEnvironments,
		toggleCreateEnvironmentDrawer,
		toggleDeleteEnvironmentModal,
		updateEnvironment,
	} = useProjectEnvironmentStore();

	const { mutate: updateEnvironmentHandler } = useMutation({
		mutationFn: (params: UpdateEnvironmentRequest) =>
			updateEnvironment({
				...params,
				envId,
				projectId,
				orgId,
			}),
		onError: (error: APIError) => {
			toast({
				action: 'error',
				title: error.details,
			});
		},
	});

	useEffect(() => {
		if (projectId && orgId) {
			getProjectEnvironments({
				projectId,
				orgId,
				page: 0,
				size: 2,
			});
		}
	}, [envId]);

	const envDropdownItems = useMemo(
		() => [
			{
				title: t('project.settings.openEnv'),
				action: () => {
					if (!project) return;
					openEnvironmentDrawer(project);
				},
				disabled: environments.length <= 1,
				icon: GitBranch,
			},
			{
				title: t('project.create_env.title'),
				action: toggleCreateEnvironmentDrawer,
				icon: Plus,
			},
			// {
			// 	title: t('version.create_a_copy'),
			// 	action: () => setCreateCopyVersionDrawerIsOpen(true),
			// 	icon: GitFork,
			// },
			{
				title: environment?.readOnly ? t('version.mark_read_write') : t('version.mark_read_only'),
				action: () => {
					if (!environment) return;
					updateEnvironmentHandler({
						name: environment?.name,
						private: environment?.private,
						readOnly: !environment?.readOnly,
					});
				},
				disabled: false,
				icon: !environment?.readOnly ? LockSimple : LockSimpleOpen,
			},
			{
				title: environment?.private ? t('version.set_public') : t('version.set_private'),
				action: () => {
					if (!environment) return;
					updateEnvironmentHandler({
						name: environment?.name,
						readOnly: environment?.readOnly,
						private: !environment?.private,
					});
				},
				icon: !environment?.private ? EyeSlash : Eye,
			},
			{
				title: t('version.delete'),
				action: toggleDeleteEnvironmentModal,
				icon: Trash,
				disabled: environments.length <= 1,
			},
		],
		[environments, environment],
	);

	return envDropdownItems;
}
