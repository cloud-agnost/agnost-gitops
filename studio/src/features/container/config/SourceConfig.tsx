import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/Form';
import { Input } from '@/components/Input';
import { RadioGroup, RadioGroupItem } from '@/components/RadioGroup';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from '@/components/Select';
import { Bitbucket, Docker, Github } from '@/components/icons';
import GitLab from '@/components/icons/GitLab';
import { useToast } from '@/hooks';
import { ClusterService } from '@/services';
import useAuthStore from '@/store/auth/authStore';
import useContainerStore from '@/store/container/containerStore';
import { CreateContainerParams, StateOption } from '@/types';
import { cn } from '@/utils';
import { Code, Folder, GitBranch } from '@phosphor-icons/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import _ from 'lodash';
import { Fragment, useEffect, useMemo, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import MultiSelect, { ValueContainerProps, components } from 'react-select';
import ContainerFormTitle from './ContainerFormLayout';

function getProviderIcon(provider: 'github' | 'gitlab' | 'bitbucket', className?: string) {
	switch (provider) {
		case 'github':
			return <Github className={cn('size-5 mr-2', className)} />;
		case 'gitlab':
			return <GitLab className={cn('size-5 mr-2', className)} />;
		case 'bitbucket':
			return <Bitbucket className={cn('size-5 mr-2', className)} />;
		default:
			return <Github className={cn('size-5 mr-2', className)} />;
	}
}

export default function SourceConfig() {
	const { t } = useTranslation();
	const form = useFormContext<CreateContainerParams>();

	return (
		<ContainerFormTitle
			title={t('container.source.title')}
			descriptionI18nKey='container.source.description'
			icon={<Code size={20} />}
		>
			<RepoOrRegistryField />
			{form.watch('repoOrRegistry') === 'repo' ? <GitConfig /> : <RegistryForm />}
		</ContainerFormTitle>
	);
}

function RepoOrRegistryField() {
	const form = useFormContext<CreateContainerParams>();
	const container = useContainerStore((state) => state.container);

	function onChange(value: string) {
		form.setValue('repoOrRegistry', value as 'repo' | 'registry');
		if (value === 'registry') {
			form.setValue('repo.connected', false);
		}
	}
	return (
		<FormField
			control={form.control}
			name='repoOrRegistry'
			render={({ field }) => (
				<FormItem className='space-y-6'>
					<FormControl>
						<RadioGroup
							onValueChange={onChange}
							defaultValue={field.value}
							className='flex items-center gap-4'
							disabled={!!container?.iid}
						>
							<FormItem className='flex items-center space-x-3 space-y-0'>
								<FormControl>
									<RadioGroupItem value='repo' />
								</FormControl>
								<FormLabel>Git repository</FormLabel>
							</FormItem>
							<FormItem className='flex items-center space-x-3 space-y-0'>
								<FormControl>
									<RadioGroupItem value='registry' />
								</FormControl>
								<FormLabel>Image repository</FormLabel>
							</FormItem>
						</RadioGroup>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}

function GitConfig() {
	const { toast } = useToast();
	const form = useFormContext<CreateContainerParams>();
	const [searchParams, setSearchParams] = useSearchParams();
	const { addGitProvider } = useContainerStore();
	const qc = useQueryClient();
	const { mutate: addProvider } = useMutation({
		mutationFn: () =>
			addGitProvider({
				accessToken: searchParams.get('access_token') as string,
				provider: searchParams.get('provider') as 'github' | 'gitlab' | 'bitbucket',
				expiresAt: searchParams.get('expires_at') as string,
				refreshToken: searchParams.get('refresh_token') as string,
			}),
		onSuccess: async (data) => {
			await qc.invalidateQueries({
				queryKey: ['git-providers'],
			});
			setTimeout(() => {
				form.setValue('repo.gitProviderId', data._id);
				form.setValue('repo.connected', true);
			}, 10);
		},
		onError: ({ details }) => {
			toast({ action: 'error', title: details });
		},
		onSettled: () => {
			setSearchParams({});
			localStorage.removeItem('createDeployment');
		},
	});

	useEffect(() => {
		if (searchParams.has('access_token')) {
			addProvider();
		}
	}, [searchParams.get('access_token')]);

	return (
		<Fragment>
			<div className='grid grid-cols-2 gap-4'>
				<ProviderSelect />
				<RepositorySelect />
			</div>
			<RepoPathField />
			<RepoWatchPathField />
			<DockerFileField />
		</Fragment>
	);
}

function ProviderSelect() {
	const form = useFormContext<CreateContainerParams>();
	const { t } = useTranslation();
	const { user } = useAuthStore();
	const { getGitProviders, providers, getGitProvider, container } = useContainerStore();

	function onProviderSelect(value: string) {
		const provider = providers?.find((provider) => provider._id === value);
		form.setValue('repo.connected', true, {
			shouldDirty: true,
		});
		form.setValue('repo.gitProviderId', provider?._id);
		form.setValue('repo.name', '');
		form.setValue('repo.branch', '');
	}

	function connectGithubHandler() {
		localStorage.setItem('createDeployment', JSON.stringify(form.getValues()));
	}

	useQuery({
		queryKey: ['git-providers'],
		queryFn: getGitProviders,
		enabled: _.isEmpty(container) || user._id === container?.createdBy,
	});

	useQuery({
		queryKey: ['git-provider'],
		queryFn: () => getGitProvider(form.watch('repo.gitProviderId') as string),
		enabled: user._id !== container?.createdBy && !_.isEmpty(container),
	});

	useEffect(() => {
		if (
			_.isEmpty(form.watch('repo.gitProviderId')) &&
			!_.isEmpty(providers) &&
			_.isEmpty(localStorage.getItem('createDeployment'))
		) {
			form.setValue('repo.gitProviderId', providers?.[0]._id);
		}
	}, [providers]);

	return (
		<div className='space-y-2'>
			<FormLabel>{t('container.source.title')}</FormLabel>
			<Select
				value={form.watch('repo.gitProviderId')}
				onValueChange={onProviderSelect}
				disabled={!_.isEmpty(container)}
			>
				<SelectTrigger className='w-full'>
					<SelectValue placeholder='Select provider' />
				</SelectTrigger>

				<SelectContent>
					{providers?.map((provider) => (
						<SelectItem key={provider._id} value={provider._id}>
							<div className='flex items-center gap-2'>
								{getProviderIcon(provider.provider)}
								{provider.username}
							</div>
						</SelectItem>
					))}
					<SelectSeparator className=' bg-wrapper-background-base' />
					{['github', 'gitlab', 'bitbucket'].map((provider) => (
						<Link
							key={provider}
							onClick={connectGithubHandler}
							to={`https://api.agnost.dev/oauth/${provider}?redirect=${window.location.href}?provider=${provider}`}
							className='select-item flex items-center gap-2'
						>
							{getProviderIcon(provider as 'github' | 'gitlab' | 'bitbucket')}
							{t('container.source.connect_git', {
								provider: _.startCase(provider),
							})}
						</Link>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

function RepositorySelect() {
	const form = useFormContext<CreateContainerParams>();
	const { t } = useTranslation();
	const { user } = useAuthStore();
	const { getBranches, getGitRepositories, container, providers } = useContainerStore();
	const { data: repositories } = useQuery({
		queryKey: ['git-repositories', form.watch('repo.gitProviderId')],
		queryFn: () => getGitRepositories(form.watch('repo.gitProviderId') as string),
		enabled:
			!!form.watch('repo.gitProviderId') &&
			(_.isEmpty(container) || user._id === container?.createdBy),
	});

	const selectedRepo = useMemo(
		() => repositories?.find((repo) => repo.fullName === form.watch('repo.name')),
		[form.watch('repo.name'), repositories],
	);

	const { data: branches } = useQuery({
		queryKey: ['branches', form.watch('repo.gitProviderId'), form.watch('repo.name')],
		queryFn: () =>
			getBranches({
				gitProviderId: form.watch('repo.gitProviderId') as string,
				owner: selectedRepo?.owner as string,
				repo: selectedRepo?.repo as string,
				repoId: selectedRepo?.repoId!,
			}),
		enabled:
			!!form.watch('repo.name') && !!form.watch('repo.gitProviderId') && !_.isNil(selectedRepo),
	});

	const repoOptions: StateOption[] = useMemo(
		() =>
			repositories?.map((repo) => ({
				value: repo.fullName,
				label: repo.fullName,
			})) ?? [],
		[repositories],
	);

	const branchesOptions: StateOption[] = useMemo(
		() =>
			branches?.map((branch) => ({
				value: branch.name,
				label: branch.name,
			})) ?? [],
		[branches],
	);

	const selectedProvider = useMemo(() => {
		return providers?.find((provider) => provider._id === form.watch('repo.gitProviderId'));
	}, [form.watch('repo.gitProviderId')]);

	const branchRef = useRef<any>(null);
	const selectedRepoRef = useRef<any>(null);

	return (
		<Fragment>
			<FormField
				control={form.control}
				name='repo.name'
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t('container.source.repo')}</FormLabel>
						<FormControl>
							<MultiSelect
								ref={selectedRepoRef}
								options={repoOptions}
								className='select-container remove-repo-select-border'
								classNamePrefix='select'
								value={field.value ? { value: field.value, label: field.value } : null}
								onChange={(selected: any) => {
									const repo = repositories?.find((repo) => repo.fullName === selected?.value);
									field.onChange(selected?.value);
									if (repo?.repoId) form.setValue('repo.repoId', repo.repoId.toString());
									if (repo?.url) form.setValue('repo.url', repo.url);
									form.setValue('repo.type', selectedProvider?.provider!);
									if (form.watch('repo.branch')) form.setValue('repo.branch', '');
								}}
								components={{ ValueContainer }}
								name='repo'
								id={selectedProvider?.provider}
								onMenuClose={() => selectedRepoRef?.current?.blur()}
								isDisabled={!_.isEmpty(container) && user._id !== container?.createdBy}
							/>
						</FormControl>

						<FormMessage />
					</FormItem>
				)}
			/>
			{form.watch('repo.name') && (
				<FormField
					control={form.control}
					name='repo.branch'
					render={({ field }) => (
						<FormItem className={'col-span-2'}>
							<FormLabel>{t('container.source.branch')}</FormLabel>
							<FormControl>
								<MultiSelect
									ref={branchRef}
									options={branchesOptions}
									className='select-container remove-repo-select-border'
									classNamePrefix='select'
									value={field.value ? { value: field.value, label: field.value } : null}
									onChange={(selected) =>
										// @ts-ignore
										field.onChange(selected ? selected.value : null)
									}
									components={{ ValueContainer }}
									isSearchable
									name='branch'
									onMenuClose={() => branchRef?.current?.blur()}
									isDisabled={!_.isEmpty(container) && user._id !== container?.createdBy}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			)}
		</Fragment>
	);
}

function RepoPathField() {
	const form = useFormContext<CreateContainerParams>();
	const { t } = useTranslation();
	const { container } = useContainerStore();
	const { user } = useAuthStore();
	return (
		<FormField
			control={form.control}
			name='repo.path'
			render={({ field }) => (
				<FormItem>
					<FormLabel>{t('container.source.rootDirectory')}</FormLabel>
					<FormControl>
						<div className='relative'>
							<Folder className='size-5 mr-2 absolute left-2 top-2' />
							<Input
								className='pl-10'
								error={Boolean(form.formState.errors.repo?.path)}
								placeholder={
									t('forms.placeholder', {
										label: t('container.source.rootDirectory'),
									}) ?? ''
								}
								disabled={!_.isEmpty(container) && user._id !== container?.createdBy}
								{...field}
							/>
						</div>
					</FormControl>
					<FormDescription>{t('container.source.rootDirectoryHelp')}</FormDescription>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}

function RepoWatchPathField() {
	const form = useFormContext<CreateContainerParams>();
	const { t } = useTranslation();
	const { container } = useContainerStore();
	const { user } = useAuthStore();
	return (
		<FormField
			control={form.control}
			name='repo.watchPath'
			render={({ field }) => (
				<FormItem>
					<FormLabel>{t('container.source.watchDirectory')}</FormLabel>
					<FormControl>
						<div className='relative'>
							<Folder className='size-5 mr-2 absolute left-2 top-2' />
							<Input
								className='pl-10'
								error={Boolean(form.formState.errors.repo?.watchPath)}
								placeholder={
									t('forms.placeholder', {
										label: t('container.source.watchDirectory'),
									}) ?? ''
								}
								disabled={!_.isEmpty(container) && user._id !== container?.createdBy}
								{...field}
							/>
						</div>
					</FormControl>
					<FormDescription className='whitespace-pre-wrap'>
						{t('container.source.watchPathHelp')}
					</FormDescription>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}

function DockerFileField() {
	const form = useFormContext<CreateContainerParams>();
	const { t } = useTranslation();
	const { container } = useContainerStore();
	const { user } = useAuthStore();
	return (
		<FormField
			control={form.control}
			name='repo.dockerfile'
			render={({ field }) => (
				<FormItem>
					<FormLabel>{t('container.source.dockerFile')}</FormLabel>
					<FormControl>
						<div className='relative'>
							<Docker className='size-5 mr-2 absolute left-2 top-2 dark:[&>*]:fill-[#E5F2FC] [&>*]:fill-[#1D63ED]' />
							<Input
								className='pl-10'
								error={Boolean(form.formState.errors.repo?.dockerfile)}
								placeholder={
									t('forms.placeholder', {
										label: t('container.source.dockerFile'),
									}) ?? ''
								}
								disabled={!_.isEmpty(container) && user._id !== container?.createdBy}
								{...field}
							/>
						</div>
					</FormControl>
					<FormDescription>{t('container.source.dockerFileHelp')}</FormDescription>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}

const ValueContainer = ({ children, ...props }: ValueContainerProps<StateOption>) => {
	return (
		<components.ValueContainer {...props} className='relative !px-8'>
			{props.selectProps.name === 'repo' ? (
				getProviderIcon(
					props.selectProps.id as 'github' | 'gitlab' | 'bitbucket',
					'absolute left-2 top-1',
				)
			) : (
				<GitBranch className='size-4 absolute left-2 top-1' />
			)}
			{children}
		</components.ValueContainer>
	);
};

function RegistryForm() {
	const form = useFormContext<CreateContainerParams>();
	const { t } = useTranslation();
	const { container } = useContainerStore();
	const { user } = useAuthStore();

	const { data: registries } = useQuery({
		queryKey: ['registries'],
		queryFn: () => ClusterService.getAllRegistries(),
	});

	useEffect(() => {
		form.setValue('registry.registryId', registries?.[0]?._id);
	}, [registries]);

	return (
		<div className='space-y-4'>
			<FormField
				control={form.control}
				name='registry.registryId'
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t('container.registry.registry')}</FormLabel>
						<FormControl>
							<Select key={field.value} value={field.value} onValueChange={field.onChange}>
								<SelectTrigger className='w-full'>
									<SelectValue placeholder='Select provider' />
								</SelectTrigger>

								<SelectContent>
									{registries?.map((registry: any) => (
										<SelectItem key={registry._id} value={registry._id}>
											{registry.name}
										</SelectItem>
									))}
									<SelectSeparator className=' bg-wrapper-background-base' />
								</SelectContent>
							</Select>
						</FormControl>
						<FormDescription>{t('container.registry.registry_help')}</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name='registry.imageUrl'
				render={({ field }) => (
					<FormItem>
						<FormLabel>{t('container.registry.image')}</FormLabel>
						<FormControl>
							<div className='relative'>
								<Docker className='size-5 mr-2 absolute left-2 top-2 dark:[&>*]:fill-[#E5F2FC] [&>*]:fill-[#1D63ED]' />
								<Input
									className='pl-10'
									error={Boolean(form.formState.errors.registry?.imageUrl)}
									placeholder={t('container.registry.image_placeholder')}
									disabled={!_.isEmpty(container) && user._id !== container?.createdBy}
									{...field}
								/>
							</div>
						</FormControl>
						<FormDescription>{t('container.registry.help')}</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	);
}
