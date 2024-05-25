import { Button } from '@/components/Button';
import { CopyInput } from '@/components/CopyInput';
import { DrawerFooter } from '@/components/Drawer';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/Form';
import { Input, Textarea } from '@/components/Input';
import { Separator } from '@/components/Separator';
import { OAUTH_URL_MAP } from '@/constants';
import useEnvironmentStore from '@/store/environment/environmentStore';
import useTypeStore from '@/store/types/typeStore';
import { OAuthProviderTypes } from '@/types';
import { capitalize, translate as t } from '@/utils';
import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom';
import * as z from 'zod';

export const AddOAuthProviderSchema = z
	.object({
		provider: z.nativeEnum(OAuthProviderTypes),
		config: z.object({
			key: z.string().optional(),
			secret: z.string().optional(),
			teamId: z.string().optional(),
			serviceId: z.string().optional(),
			keyId: z.string().optional(),
			privateKey: z.string().optional(),
		}),
	})
	.superRefine((data, ctx) => {
		const { config, provider } = data;
		if (provider === OAuthProviderTypes.Apple) {
			if (!config.teamId) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: t('forms.required', {
						label: t('version.authentication.teamId'),
					}),
					path: ['config', 'teamId'],
				});
			}
			if (!config.serviceId) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: t('forms.required', {
						label: t('version.authentication.serviceId'),
					}),
					path: ['config', 'serviceId'],
				});
			}
			if (!config.keyId) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: t('forms.required', {
						label: t('version.authentication.keyId'),
					}),
					path: ['config', 'keyId'],
				});
			}
		} else {
			if (!config.key) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: t('forms.required', {
						label: t('version.authentication.key'),
					}),
					path: ['config', 'key'],
				});
			}
			if (!config.secret) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: t('forms.required', {
						label: t('version.authentication.secret'),
					}),
					path: ['config', 'secret'],
				});
			}
		}
	});
export default function ProviderFrom({ loading }: { loading: boolean }) {
	const form = useFormContext<z.infer<typeof AddOAuthProviderSchema>>();
	const provider = form.watch('provider');
	const { environment } = useEnvironmentStore();
	const callbackUrl = `${window.location.origin}/${environment?.iid}/agnost/oauth/${provider}/callback`;
	const { oAuthProviderTypes } = useTypeStore();

	const providerParams = useMemo(() => {
		return oAuthProviderTypes.find((type) => type.provider === form.watch('provider'))?.params;
	}, [provider]);
	return (
		<>
			{provider && (
				<p className='text-sm text-subtle font-sfCompact'>
					<Trans
						i18nKey='version.authentication.oAuth_provider_desc'
						components={{
							platform: (
								<Link
									to={OAUTH_URL_MAP[provider]}
									className='link'
									target='_blank'
									rel='noopener noreferrer'
								/>
							),
						}}
						values={{
							provider: capitalize(provider),
							platform: t(`version.authentication.${provider}`),
							params: providerParams?.map((param) => param.title).join(', '),
						}}
					/>
				</p>
			)}
			{providerParams?.map((param) => (
				<FormField
					key={param.name}
					control={form.control}
					name={`config.${param.name}`}
					render={({ field }) => (
						<FormItem>
							<FormLabel>{param.title}</FormLabel>
							<FormControl>
								{param.multiline ? (
									<Textarea
										error={Boolean(form.formState.errors.config?.[param.name])}
										placeholder={
											t('forms.placeholder', {
												label: param.title,
											}) ?? ''
										}
										{...field}
									/>
								) : (
									<Input
										error={Boolean(form.formState.errors.config?.[param.name])}
										placeholder={
											t('forms.placeholder', {
												label: param.title,
											}) ?? ''
										}
										{...field}
									/>
								)}
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			))}
			<Separator />
			<h4 className='text-sm text-default font-sfCompact'>
				{t('version.authentication.callback_url')}
			</h4>
			<p className='text-sm text-subtle font-sfCompact'>
				<Trans
					i18nKey='version.authentication.callback_url_desc'
					values={{ provider: capitalize(provider), providerLowercase: provider }}
					components={{ br: <br /> }}
				/>
			</p>
			<CopyInput readOnly value={callbackUrl} />
			<DrawerFooter>
				<Button type='submit' variant='primary' size='lg' loading={loading}>
					{t('general.save')}
				</Button>
			</DrawerFooter>
		</>
	);
}
