import { Button } from '@/components/Button';
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/Form';
import { Input } from '@/components/Input';
import { Docker, Github } from '@/components/icons';
import { useToast, useUpdateEffect } from '@/hooks';
import useContainerStore from '@/store/container/containerStore';
import { CreateContainerParams, StateOption } from '@/types/container';
import { Code, Folder, GitBranch } from '@phosphor-icons/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { Fragment, useEffect, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import MultiSelect, { ValueContainerProps, components } from 'react-select';
import ContainerFormTitle from './ContainerFormLayout';

export default function SourceConfig() {
	const { toast } = useToast();
	const form = useFormContext<CreateContainerParams>();
	const { t } = useTranslation();
	const [searchParams] = useSearchParams();
	const accessToken = searchParams.get('access_token');
	const { addGitProvider, getBranches, getGitRepositories, gitProvider } = useContainerStore();

	const { data: repositories } = useQuery({
		queryKey: ['git-repositories', gitProvider?._id],
		queryFn: () => getGitRepositories(gitProvider?._id as string),
		enabled: !_.isEmpty(gitProvider),
	});

	const selectedRepo = useMemo(
		() => repositories?.find((repo) => repo.fullName === form.watch('repo.name')),
		[form.watch('repo.name'), repositories],
	);
	const { data: branches } = useQuery({
		queryKey: ['branches', gitProvider?._id, form.watch('repo.name')],
		queryFn: () =>
			getBranches({
				gitProviderId: gitProvider?._id as string,
				owner: selectedRepo?.owner as string,
				repo: selectedRepo?.repo as string,
			}),
		enabled: !!form.watch('repo.name') && !_.isEmpty(gitProvider) && !_.isNil(selectedRepo),
	});

	const { mutate: addProvider } = useMutation({
		mutationFn: () =>
			addGitProvider({ accessToken: accessToken as string, provider: 'github', refreshToken: '' }),
		onSuccess: (data) => {
			form.setValue('repo.gitProviderId', data._id);
			form.setValue('repo.connected', true, {
				shouldDirty: true,
			});
		},
		onError: ({ details }) => {
			toast({ action: 'error', title: details });
		},
	});

	function connectGithubHandler() {
		localStorage.setItem('createDeployment', JSON.stringify(form.getValues()));
	}

	function disconnectGitHandler() {
		form.setValue('repo.connected', false, {
			shouldDirty: true,
		});
		useContainerStore.setState({ gitProvider: undefined });
	}
	useEffect(() => {
		if (accessToken && _.isEmpty(gitProvider)) {
			addProvider({ accessToken, provider: 'github', refreshToken: '' });
		}
	}, [accessToken]);

	useUpdateEffect(() => {
		form.setValue('repo.url', selectedRepo?.url ?? '');
	}, [selectedRepo]);

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

	useEffect(() => {
		if (!_.isNil(gitProvider)) {
			form.setValue('repo.connected', true, {
				shouldDirty: true,
			});
			form.setValue('repo.gitProviderId', gitProvider._id);
		}
	}, [gitProvider]);

	return (
		<ContainerFormTitle
			title={t('container.source.title')}
			descriptionI18nKey='container.source.description'
			icon={<Code size={20} />}
		>
			<Fragment>
				{!form.watch('repo.connected') && _.isNil(gitProvider) ? (
					<Button
						variant='primary'
						onClick={connectGithubHandler}
						to={`https://auth.agnost.dev/provider/github?redirect=${window.location.href}`}
					>
						<Github className='size-5 mr-2' />
						{t('container.source.connect_github')}
					</Button>
				) : (
					<>
						<Button variant='destructive' onClick={disconnectGitHandler}>
							<Github className='size-5 mr-2' />
							{t('container.disconnect')}
						</Button>
						<div className='grid grid-cols-2 gap-4'>
							<FormField
								control={form.control}
								name='repo.name'
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('container.source.repo')}</FormLabel>
										<FormControl>
											<MultiSelect
												options={repoOptions}
												className='select-container'
												classNamePrefix='select'
												defaultValue={
													field.value ? { value: field.value, label: field.value } : null
												}
												value={field.value ? { value: field.value, label: field.value } : null}
												onChange={(selected) => {
													// @ts-ignore
													field.onChange(selected?.value);
													if (form.watch('repo.branch')) form.setValue('repo.branch', '');
												}}
												components={{ ValueContainer }}
												name='repo'
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
										<FormItem>
											<FormLabel>{t('container.source.branch')}</FormLabel>
											<FormControl>
												<MultiSelect
													options={branchesOptions}
													className='select-container'
													classNamePrefix='select'
													defaultValue={
														field.value ? { value: field.value, label: field.value } : null
													}
													value={field.value ? { value: field.value, label: field.value } : null}
													// @ts-ignore
													onChange={(selected) => field.onChange(selected?.value)}
													components={{ ValueContainer }}
													isSearchable
													name='branch'
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}
						</div>

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
												{...field}
											/>
										</div>
									</FormControl>
									<FormDescription>{t('container.source.rootDirectoryHelp')}</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
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
												{...field}
											/>
										</div>
									</FormControl>
									<FormDescription>{t('container.source.dockerFileHelp')}</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</>
				)}
			</Fragment>
		</ContainerFormTitle>
	);
}

const ValueContainer = ({ children, ...props }: ValueContainerProps<StateOption>) => (
	<components.ValueContainer {...props} className='relative !px-8'>
		{props.selectProps.name === 'repo' ? (
			<Github className='size-4 absolute left-2 top-1' />
		) : (
			<GitBranch className='size-4 absolute left-2 top-1' />
		)}
		{children}
	</components.ValueContainer>
);
