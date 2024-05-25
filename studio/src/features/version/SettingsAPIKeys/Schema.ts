import { AUTHORIZATION_OPTIONS, ENDPOINT_ACCESS_PROPERTIES } from '@/constants';
import { isEmpty, translate } from '@/utils';
import * as z from 'zod';

const URL_REGEX =
	/^(https?:\/\/)?((?:([a-z0-9-]+|\*)\.)?([a-z0-9-]{1,61})\.([a-z0-9]{2,61})|(localhost)):?(\d{1,5})?$/gi;

const Schema = z.object({
	general: z.object({
		expiryDate: z.date().optional(),
		name: z
			.string({
				required_error: translate('forms.required', {
					label: translate('general.name'),
				}),
			})
			.min(2, translate('forms.min2.error', { label: translate('general.name') }))
			.max(64, translate('forms.max64.error', { label: translate('general.name') }))
			.trim()
			.refine(
				(value) => value.trim().length > 0,
				translate('forms.required', {
					label: translate('general.name'),
				}),
			),
		realtime: z.boolean(),
		endpoint: z
			.object({
				type: z.enum(ENDPOINT_ACCESS_PROPERTIES, {
					required_error: 'You must select one of the options',
				}),
				allowedEndpoints: z.array(
					z.object({
						url: z.string(),
					}),
				),
				excludedEndpoints: z.array(
					z.object({
						url: z.string(),
					}),
				),
			})
			.superRefine(({ type, allowedEndpoints, excludedEndpoints }, ctx) => {
				if (type === 'custom-allowed') {
					const domains = allowedEndpoints.map((value) => value.url).filter(Boolean);
					if (isEmpty(domains)) {
						return ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message: translate('forms.enterAtLeastOne', {
								label: translate('general.endpoint').toLowerCase(),
							}).toString(),
						});
					}
				} else if (type === 'custom-excluded') {
					const domains = excludedEndpoints.map((value) => value.url).filter(Boolean);
					if (isEmpty(domains)) {
						return ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message: translate('forms.enterAtLeastOne', {
								label: translate('general.endpoint').toLowerCase(),
							}).toString(),
						});
					}
				}
			}),
	}),
	domain: z
		.object({
			type: z.enum(AUTHORIZATION_OPTIONS).default('all'),
			list: z.array(
				z.object({
					domain: z
						.string()
						.regex(URL_REGEX, {
							message: translate('forms.url.without_path_error').toString(),
						})
						.regex(/^(https?:\/\/).*/, {
							message: translate('forms.url.without_http_error').toString(),
						})
						.optional()
						.or(z.literal('')),
				}),
			),
		})
		.superRefine(({ list, type }, ctx) => {
			const domains = list.map((value) => value.domain).filter(Boolean);
			if (type === 'specified' && isEmpty(domains)) {
				return ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: translate('forms.enterAtLeastOne', {
						label: translate('general.url').toUpperCase(),
					}).toString(),
				});
			}
		}),
	ip: z
		.object({
			type: z.enum(AUTHORIZATION_OPTIONS).default('all'),
			list: z.array(
				z.object({
					ip: z
						.string()
						.ip({ message: translate('forms.IP.error').toString() })
						.optional()
						.or(z.literal('')),
				}),
			),
		})
		.superRefine(({ list, type }, ctx) => {
			const ips = list.map((value) => value.ip).filter(Boolean);
			if (type === 'specified' && isEmpty(ips)) {
				return ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: translate('forms.enterAtLeastOne', {
						label: translate('general.IP').toLowerCase(),
					}).toString(),
				});
			}
		}),
});

export default Schema;
