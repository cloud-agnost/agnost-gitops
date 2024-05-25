import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';
import {
	DATABASE,
	EMAIL_REGEX,
	MAX_LENGTHS,
	MYSQL_RESERVED_WORDS,
	POSTGRES_RESERVED_WORDS,
	REFERENCE_FIELD_ACTION,
	SQL_SERVER_RESERVED_WORDS,
	URL_REGEX,
} from '@/constants';
import { useToast } from '@/hooks';
import useAuthorizeVersion from '@/hooks/useAuthorizeVersion';
import useDatabaseStore from '@/store/database/databaseStore.ts';
import useModelStore from '@/store/database/modelStore.ts';
import useTypeStore from '@/store/types/typeStore.ts';
import {
	APIError,
	FieldType,
	FieldTypes,
	StorageNameSchema,
	ReferenceAction,
	TimestampsSchema,
} from '@/types';
import { capitalize, cn, isMobilePhone, toDisplayName } from '@/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/Button';
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from 'components/Drawer';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from 'components/Form';
import { Input, Textarea } from 'components/Input';
import { Separator } from 'components/Separator';
import { SettingsFormItem } from 'components/SettingsFormItem';
import { Switch } from 'components/Switch';
import { Fragment, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import * as z from 'zod';
import _ from 'lodash';

type View = keyof FieldType['view'];

interface EditOrCreateModelDrawerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editMode?: boolean;
	type?: FieldType;
}

const defaultValueDisabledTypes = [
	'time',
	'object',
	'object-list',
	'encrypted-text',
	'basic-values-list',
	'geo-point',
	'rich-text',
	'binary',
	'json',
];

const booleanDefaults = [
	{
		label: 'Not set',
		value: '',
	},
	{
		label: 'True',
		value: 'true',
	},
	{
		label: 'False',
		value: 'false',
	},
];

const datetimeDefaults = [
	{
		label: 'Not set',
		value: '',
	},
	{
		label: 'Current date',
		value: '$$NOW',
	},
];

export default function EditOrCreateFieldDrawer({
	open,
	onOpenChange,
	editMode,
	type,
}: EditOrCreateModelDrawerProps) {
	const languages = useTypeStore((state) => state.ftsIndexLanguages);
	const { t } = useTranslation();
	const fieldTypes = useTypeStore((state) => state.fieldTypes);
	const {
		field: fieldToEdit,
		addNewField,
		updateField,
		referenceModels,
		getReferenceModels,
	} = useModelStore();
	const database = useDatabaseStore((state) => state.database);
	const canCreate = useAuthorizeVersion('model.create');
	const MAX_LENGTH = MAX_LENGTHS[editMode ? fieldToEdit?.type : type?.name ?? ''];
	const { toast } = useToast();
	const { dbId, modelId, appId, versionId, orgId } = useParams() as {
		orgId: string;
		appId: string;
		versionId: string;
		dbId: string;
		modelId: string;
	};

	const TYPE = editMode ? fieldToEdit?.type : type?.name ?? '';
	const hasMaxLength = ['text', 'encrypted-text'].includes(TYPE);
	const isDecimal = TYPE === 'decimal';
	const isBoolean = TYPE === 'boolean';
	const isInteger = TYPE === 'integer';
	const isEnum = TYPE === 'enum';
	const isReference = TYPE === 'reference';
	const isDatetime = TYPE === 'datetime';
	const isDate = TYPE === 'date';
	const isGeoPoint = TYPE === 'geo-point';
	const isPhone = TYPE === 'phone';
	const isEmail = TYPE === 'email';
	const isLink = TYPE === 'link';

	const hasDefaultValue = !defaultValueDisabledTypes.includes(TYPE);

	const defaults = isDatetime || isDate ? datetimeDefaults : isBoolean ? booleanDefaults : [];

	const view = editMode
		? fieldTypes.find((type) => type.name === fieldToEdit?.type)?.view
		: type?.view;

	if (database.type === DATABASE.SQLServer && ['rich-text'].includes(TYPE) && view?.indexed) {
		view.indexed = false;
	}

	const languageOptions = {
		[DATABASE.MongoDB]: languages.MongoDB,
		[DATABASE.MySQL]: languages.MySQL,
		[DATABASE.PostgreSQL]: languages.PostgreSQL,
		[DATABASE.SQLServer]: languages['SQL Server'],
	}[database.type];

	const views = Object.entries(view ?? {})
		.filter(([, value]) => !!value)
		.map(([key]) => key) as View[];

	const Schema = z.object({
		general: z
			.object({
				name: StorageNameSchema.transform((value) => {
					if (database?.type === DATABASE.PostgreSQL) return value.toLowerCase();
					else return value;
				}),
				type: z.nativeEnum(FieldTypes),
				required: z.boolean(),
				unique: z.boolean(),
				indexed: z.boolean(),
				searchable: z.boolean(),
				immutable: z.boolean(),
				defaultValue: z.string().optional(),
				description: z.string().optional(),
				language: z.string().optional(),
				maxLength: z
					.string()
					.regex(/^\d+$/, {
						message: t('forms.number', {
							label: capitalize(t('general.max_length').toLowerCase()),
						}).toString(),
					})
					.optional(),
				decimalDigits: z
					.number({
						invalid_type_error: t('forms.number', {
							label: capitalize(t('general.decimal_digits').toLowerCase()),
						}).toString(),
					})
					.min(1, {
						message: t('forms.decimal.decimal_digits_range', {
							length: MAX_LENGTH,
							min_decimal_digits: 1,
							max_decimal_digits: MAX_LENGTH,
						}).toString(),
					})
					.max(MAX_LENGTH as number, {
						message: t('forms.decimal.decimal_digits_range', {
							length: MAX_LENGTH,
							min_decimal_digits: 1,
							max_decimal_digits: MAX_LENGTH,
						}).toString(),
					})
					.optional(),
				referenceModelIid: z
					.string()
					.refine((value) => referenceModels.some((model) => model.iid === value), {
						message: t('forms.invalid', {
							label: t('database.fields.reference_model'),
						}).toString(),
					})
					.optional(),
				referenceAction: z.enum(REFERENCE_FIELD_ACTION).optional(),
				enumSelectList: z.string().optional(),
				timeStamps: TimestampsSchema,
			})
			.superRefine((arg, ctx) => {
				if (isInteger && arg?.defaultValue && !Number.isInteger(Number(arg.defaultValue))) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: t('forms.invalid', {
							label: capitalize(t('general.default_value').toLowerCase()),
						}).toString(),
						path: ['defaultValue'],
					});
				}

				if (hasMaxLength && Number(arg?.defaultValue?.length) > Number(arg.maxLength)) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: t('forms.maxLength.error', {
							length: arg.maxLength,
							label: capitalize(t('general.default_value').toLowerCase()),
						}).toString(),
						path: ['defaultValue'],
					});
				}

				if (isEnum) {
					const enumValues = arg.enumSelectList?.trim().split('\n');
					if (arg?.defaultValue && !enumValues?.includes(arg.defaultValue)) {
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message: t('forms.invalid', {
								label: capitalize(t('general.default_value').toLowerCase()),
							}).toString(),
							path: ['defaultValue'],
						});
					}

					if (enumValues?.some((value) => value.length > (MAX_LENGTH as number))) {
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message: t('forms.maxLength.error', {
								length: MAX_LENGTH,
								label: capitalize(t('general.max_length').toLowerCase()),
							}).toString(),
							path: ['enumSelectList'],
						});
					}
				}

				if (isDecimal && arg?.defaultValue) {
					if (isNaN(Number(arg.defaultValue))) {
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message: t('forms.invalid', {
								label: capitalize(t('general.default_value').toLowerCase()),
							}).toString(),
							path: ['defaultValue'],
						});
					}
					if (arg?.decimalDigits) {
						const decimalDigits = Number(arg.decimalDigits);
						const decimalDigitsLength = arg.defaultValue?.split('.')[1]?.length ?? 0;

						if (decimalDigitsLength > decimalDigits) {
							ctx.addIssue({
								code: z.ZodIssueCode.custom,
								message: t('forms.decimal.decimal_digits', {
									decimal_digits: decimalDigits,
								}).toString(),
								path: ['defaultValue'],
							});
						}
					}
				}

				if (isEmail) {
					if (arg?.defaultValue && !EMAIL_REGEX.test(arg.defaultValue)) {
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message: t('forms.invalid', {
								label: capitalize(t('general.default_value').toLowerCase()),
							}).toString(),
							path: ['defaultValue'],
						});
					}
				}

				if (isLink) {
					if (arg?.defaultValue && !URL_REGEX.test(arg.defaultValue)) {
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message: t('forms.invalid', {
								label: capitalize(t('general.default_value').toLowerCase()),
							}).toString(),
							path: ['defaultValue'],
						});
					}
				}

				if (isPhone) {
					if (arg?.defaultValue && !isMobilePhone(arg.defaultValue)) {
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message: t('forms.invalid', {
								label: capitalize(t('general.default_value').toLowerCase()),
							}).toString(),
							path: ['defaultValue'],
						});
					}
				}

				if (hasMaxLength && !arg.maxLength) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: t('forms.required', {
							label: capitalize(t('general.max_length').toLowerCase()),
						}).toString(),
						path: ['maxLength'],
					});
				}

				if (
					editMode &&
					database.type !== DATABASE.MongoDB &&
					hasMaxLength &&
					((fieldToEdit.text?.maxLength && Number(arg.maxLength) < fieldToEdit.text.maxLength) ||
						(fieldToEdit.encryptedText?.maxLength &&
							Number(arg.maxLength) < fieldToEdit.encryptedText.maxLength))
				) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: t('forms.fieldMaxLength.error').toString(),
						path: ['maxLength'],
					});
				}

				if (hasMaxLength) {
					const valueAsNumber = Number(arg.maxLength);
					const isText = TYPE === 'text' && typeof MAX_LENGTH === 'object';
					const isBetween = (min: number, max: number) =>
						valueAsNumber >= min && valueAsNumber <= max;

					const conditionForText = isText && !isBetween(1, MAX_LENGTH[database.type]);
					const conditionForEncryptedText =
						typeof MAX_LENGTH === 'number' && !isBetween(1, MAX_LENGTH);

					if (conditionForText || conditionForEncryptedText) {
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							message: t('forms.maxLength.error', {
								length: conditionForText ? MAX_LENGTH[database.type] : MAX_LENGTH,
								label: capitalize(t('general.max_length').toLowerCase()),
							}).toString(),
							path: ['maxLength'],
						});
					}
				}

				if (isEnum && (!arg.enumSelectList || arg.enumSelectList?.trim().length === 0)) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: t('forms.enterAtLeastOneValue').toString(),
						path: ['enumSelectList'],
					});
				}

				if (isReference && !arg.referenceModelIid) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: t('forms.required', {
							label: capitalize(t('database.fields.reference_model').toLowerCase()),
						}).toString(),
						path: ['referenceModelIid'],
					});
				}

				if (isReference && !arg.referenceAction && database.type !== DATABASE.MongoDB) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: t('forms.required', {
							label: capitalize(t('database.fields.reference_action').toLowerCase()),
						}).toString(),
						path: ['referenceAction'],
					});
				}

				if (
					isReference &&
					database.type !== DATABASE.MongoDB &&
					arg.defaultValue &&
					isNaN(Number(arg.defaultValue))
				) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: t('forms.number', {
							label: capitalize(t('general.default_value').toLowerCase()),
						}).toString(),
						path: ['defaultValue'],
					});
				}

				if (
					isReference &&
					database.type !== DATABASE.MongoDB &&
					arg.defaultValue &&
					isNaN(Number(arg.defaultValue))
				) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: t('forms.number', {
							label: capitalize(t('general.default_value').toLowerCase()),
						}).toString(),
						path: ['defaultValue'],
					});
				}

				if (
					database?.type === DATABASE.PostgreSQL &&
					POSTGRES_RESERVED_WORDS.includes(arg.name.toLowerCase())
				) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: t('forms.reservedWord', {
							label: arg.name,
						}).toString(),
						path: ['name'],
					});
				}

				if (
					database?.type === DATABASE.MySQL &&
					MYSQL_RESERVED_WORDS.includes(arg.name.toLowerCase())
				) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: t('forms.reservedWord', {
							label: arg.name,
						}).toString(),
						path: ['name'],
					});
				}

				if (
					database?.type === DATABASE.SQLServer &&
					SQL_SERVER_RESERVED_WORDS.includes(arg.name.toLowerCase())
				) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: t('forms.reservedWord', {
							label: arg.name,
						}).toString(),
						path: ['name'],
					});
				}

				if (isDecimal && !arg.decimalDigits) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: t('forms.required', {
							label: capitalize(t('general.decimal_digits').toLowerCase()),
						}).toString(),
						path: ['decimalDigits'],
					});
				}

				if (arg.searchable && languageOptions && !arg.language) {
					const label =
						database.type === DATABASE.MySQL
							? t('database.fields.searchable.collation.title')
							: t('database.fields.searchable.lang.title');

					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: t('forms.required', {
							label: capitalize(label.toLowerCase()),
						}).toString(),
						path: ['language'],
					});
				}
			}),
	});

	const form = useForm<z.infer<typeof Schema>>({
		resolver: zodResolver(Schema),
		defaultValues: {
			general: {
				type: type?.name as FieldTypes,
				immutable: false,
				indexed: false,
				required: false,
				searchable: false,
				unique: false,
				timeStamps: {
					enabled: true,
					createdAt: 'createdAt',
					updatedAt: 'updatedAt',
				},
				defaultValue:
					!editMode && (isBoolean || isDatetime || isDate) ? defaults[0].value : undefined,
				referenceModelIid: fieldToEdit?.reference?.iid,
			},
		},
	});

	const indexWatch = form.watch('general.indexed');
	const requiredWatch = form.watch('general.required');
	const searchableWatch = form.watch('general.searchable');

	useEffect(() => {
		if (database?.type !== DATABASE.MySQL || !isGeoPoint) return;

		if (form.getValues('general.indexed')) {
			form.setValue('general.required', true);
		}
	}, [indexWatch, database, isGeoPoint]);

	useEffect(() => {
		if (database?.type !== DATABASE.MySQL || !isGeoPoint) return;

		if (!form.getValues('general.required')) {
			form.setValue('general.indexed', false);
		}
	}, [requiredWatch, database, isGeoPoint]);

	useEffect(() => {
		if (!open) form.reset();
		else getModels();
	}, [open]);

	useEffect(() => {
		if (fieldToEdit && open && editMode) setDefaultsForEdit();
	}, [fieldToEdit, open, editMode]);

	async function getModels() {
		if (TYPE !== 'reference') return;

		getReferenceModels({
			orgId: orgId,
			appId: appId,
			versionId: versionId,
			dbId: dbId,
		});
	}

	const { mutateAsync, isPending } = useMutation({
		mutationFn: editMode ? updateField : addNewField,
		mutationKey: ['createField'],
		onError: (error: APIError) => {
			toast({
				title: error.details,
				action: 'error',
			});
		},
		onSuccess: () => {
			onClose();
			if (editMode) {
				toast({
					title: t('database.fields.edit_success') as string,
					action: 'success',
				});
			}
		},
	});

	const getDefaultValue = (defaultValue: string) => {
		if (editMode && hasDefaultValue && !defaultValue) {
			return '$$unset';
		}

		if ((isReference && database.type !== DATABASE.MongoDB) || isDecimal || isInteger) {
			return Number(defaultValue);
		}

		if (isBoolean) {
			return defaultValue ? JSON.parse(defaultValue) : undefined;
		}

		return defaultValue;
	};
	async function onSubmit(data: z.infer<typeof Schema>) {
		const dataForAPI = {
			...(editMode && { fieldId: fieldToEdit._id }),
			type: data.general.type,
			orgId,
			appId,
			versionId,
			dbId,
			modelId,
			name: data.general.name,
			required: data.general.required,
			unique: data.general.unique,
			immutable: data.general.immutable,
			indexed:
				editMode &&
				isGeoPoint &&
				database.type === DATABASE.MySQL &&
				!fieldToEdit.indexed &&
				!fieldToEdit.required
					? false
					: data.general.indexed,
			defaultValue: getDefaultValue(data.general.defaultValue as string),
			description: data.general.description,
			text: {
				searchable: data.general.searchable,
				maxLength: Number(data.general.maxLength),
				language: data.general.language,
			},
			richText: {
				searchable: data.general.searchable,
				language: data.general.language,
			},
			encryptedText: {
				maxLength: Number(data.general.maxLength),
			},
			decimal: {
				decimalDigits: Number(data.general.decimalDigits),
			},
			reference: {
				iid: data.general.referenceModelIid as string,
				action: data.general.referenceAction as ReferenceAction,
			},
			enum: {
				selectList: data.general.enumSelectList?.trim().split('\n') as string[],
			},
			object: {
				timestamps: data.general.timeStamps,
			},
			objectList: {
				timestamps: data.general.timeStamps,
			},
		};

		mutateAsync(dataForAPI);
	}

	function setDefaultsForEdit() {
		form.setValue('general.name', fieldToEdit.name);
		form.setValue('general.type', fieldToEdit.type);
		form.setValue('general.required', fieldToEdit.required);
		form.setValue('general.unique', fieldToEdit.unique);
		form.setValue('general.immutable', fieldToEdit.immutable);
		form.setValue('general.indexed', fieldToEdit.indexed);
		form.setValue('general.description', fieldToEdit.description);

		if (!_.isNil(fieldToEdit.defaultValue)) {
			form.setValue('general.defaultValue', fieldToEdit.defaultValue.toString());
		}

		if (fieldToEdit.text) {
			form.setValue('general.searchable', fieldToEdit.text.searchable);
			form.setValue('general.maxLength', fieldToEdit.text.maxLength.toString());
			form.setValue('general.language', fieldToEdit.text.language);
		}

		if (fieldToEdit.richText) {
			form.setValue('general.searchable', fieldToEdit.richText.searchable);
			form.setValue('general.language', fieldToEdit.richText.language);
		}

		if (fieldToEdit.encryptedText) {
			form.setValue('general.maxLength', fieldToEdit.encryptedText.maxLength.toString());
		}

		if (fieldToEdit.decimal) {
			form.setValue('general.decimalDigits', fieldToEdit.decimal.decimalDigits);
		}

		if (fieldToEdit.enum) {
			form.setValue('general.enumSelectList', fieldToEdit.enum.selectList.join('\n'));
		}

		if (fieldToEdit.object) {
			form.setValue('general.timeStamps.enabled', fieldToEdit.object.timestamps?.enabled);
			form.setValue('general.timeStamps.createdAt', fieldToEdit.object.timestamps?.createdAt);
			form.setValue('general.timeStamps.updatedAt', fieldToEdit.object.timestamps?.updatedAt);
		}

		if (fieldToEdit.objectList) {
			form.setValue('general.timeStamps.enabled', fieldToEdit.objectList.timestamps?.enabled);
			form.setValue('general.timeStamps.createdAt', fieldToEdit.objectList.timestamps?.createdAt);
			form.setValue('general.timeStamps.updatedAt', fieldToEdit.objectList.timestamps?.updatedAt);
		}

		if (fieldToEdit.reference) {
			form.setValue('general.referenceAction', fieldToEdit.reference.action);
			form.setValue('general.referenceModelIid', fieldToEdit.reference.iid);
		}
	}

	function onClose() {
		form.reset();
		onOpenChange(false);
	}

	return (
		<Drawer open={open} onOpenChange={onOpenChange}>
			<DrawerContent className='overflow-x-hidden'>
				<DrawerHeader>
					<DrawerTitle>
						{editMode
							? t('database.fields.edit')
							: t('database.fields.add_field', {
									field: toDisplayName(type ? type?.name : ''),
								})}
					</DrawerTitle>
				</DrawerHeader>
				<div className='p-6 space-y-6'>
					<Form {...form}>
						<form className='space-y-6' onSubmit={form.handleSubmit(onSubmit)}>
							<FormField
								control={form.control}
								name='general.name'
								render={({ field, formState: { errors } }) => (
									<FormItem className='space-y-1'>
										<FormLabel>{t('database.fields.form.name')}</FormLabel>
										<FormControl>
											<Input
												error={Boolean(errors.general?.name)}
												type='text'
												placeholder={t('forms.placeholder', {
													label: t('database.fields.form.name').toLowerCase(),
												}).toString()}
												{...field}
											/>
										</FormControl>
										<FormDescription>{t('forms.max64.description')}</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Separator />
							<FormField
								control={form.control}
								name='general.description'
								render={({ field }) => (
									<FormItem className='space-y-1'>
										<FormLabel>{t('database.fields.field_desc')}</FormLabel>
										<FormControl>
											<Textarea
												error={Boolean(form.formState.errors.general?.description)}
												placeholder={t('database.fields.field_desc_placeholder').toString()}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Separator />
							{hasMaxLength && (
								<>
									<FormField
										control={form.control}
										name='general.maxLength'
										render={({ field, formState: { errors } }) => (
											<FormItem className='space-y-1'>
												<FormLabel>{t('general.max_length')}</FormLabel>
												<FormControl>
													<Input
														error={Boolean(errors.general?.maxLength)}
														type='number'
														placeholder={
															t('forms.placeholder', {
																label: t('general.max_length').toLowerCase(),
															}) as string
														}
														{...field}
													/>
												</FormControl>
												<FormMessage />
												{database.type !== DATABASE.MongoDB && (
													<FormDescription>
														{t('forms.maxLength.description', {
															length:
																typeof MAX_LENGTH === 'number'
																	? MAX_LENGTH
																	: MAX_LENGTH[database.type],
														})}
													</FormDescription>
												)}
											</FormItem>
										)}
									/>
									<Separator />
								</>
							)}
							{isDecimal && (
								<>
									<FormField
										control={form.control}
										name='general.decimalDigits'
										render={({ field, formState: { errors } }) => (
											<FormItem className='space-y-1'>
												<FormLabel>{t('general.decimal_digits')}</FormLabel>
												<FormControl>
													<Input
														error={Boolean(errors.general?.decimalDigits)}
														type='number'
														placeholder={
															t('forms.placeholder', {
																label: t('general.decimal_digits').toLowerCase(),
															}) as string
														}
														{...field}
														onChange={undefined}
														onInput={(e) => field.onChange(e.currentTarget.valueAsNumber)}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<Separator />
								</>
							)}
							{isEnum && (
								<>
									<FormField
										control={form.control}
										name='general.enumSelectList'
										render={({ field }) => (
											<FormItem className='space-y-1'>
												<FormLabel>{t('database.fields.enum_values')}</FormLabel>
												<FormControl>
													<Textarea
														error={Boolean(form.formState.errors.general?.enumSelectList)}
														rows={4}
														placeholder={t('database.fields.enum_placeholder').toString()}
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<Separator />
								</>
							)}
							{isReference && (
								<>
									<div
										className={cn(
											'grid grid-cols-2 gap-4',
											database.type === DATABASE.MongoDB && 'grid-cols-1',
										)}
									>
										{database.type !== DATABASE.MongoDB && (
											<FormField
												control={form.control}
												name='general.referenceAction'
												render={({ field, formState: { errors } }) => (
													<FormItem className='space-y-1'>
														<FormLabel>{t('database.fields.reference_action')}</FormLabel>
														<FormControl>
															<Select
																defaultValue={field.value}
																value={field.value}
																name={field.name}
																onValueChange={field.onChange}
															>
																<FormControl>
																	<SelectTrigger
																		className={cn(
																			'w-full input',
																			errors.general?.referenceAction && 'input-error',
																		)}
																	>
																		<SelectValue
																			className={cn('text-subtle')}
																			placeholder={t(
																				'database.fields.reference_action_placeholder',
																			)}
																		/>
																	</SelectTrigger>
																</FormControl>
																<SelectContent align='center'>
																	{REFERENCE_FIELD_ACTION.map((action) => {
																		return (
																			<SelectItem
																				className='px-3 py-[6px] w-full max-w-full cursor-pointer'
																				key={action}
																				value={action}
																			>
																				<div className='flex items-center gap-2'>{action}</div>
																			</SelectItem>
																		);
																	})}
																</SelectContent>
															</Select>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										)}
										<FormField
											control={form.control}
											name='general.referenceModelIid'
											render={({ field, formState: { errors } }) => {
												return (
													<FormItem className='space-y-1'>
														<FormLabel>{t('database.fields.reference_model')}</FormLabel>
														<FormControl>
															<Select
																value={field.value}
																name={field.name}
																onValueChange={field.onChange}
															>
																<FormControl>
																	<SelectTrigger
																		className={cn(
																			'w-full input',
																			errors.general?.referenceModelIid && 'input-error',
																		)}
																	>
																		<SelectValue
																			className='text-subtle'
																			placeholder={t('database.fields.reference_model_placeholder')}
																		/>
																	</SelectTrigger>
																</FormControl>
																<SelectContent align='center'>
																	{referenceModels.map((model) => {
																		return (
																			<SelectItem
																				className='px-3 py-[6px] w-full max-w-full cursor-pointer'
																				key={model._id}
																				value={model.iid}
																			>
																				{model.name}
																			</SelectItem>
																		);
																	})}
																</SelectContent>
															</Select>
														</FormControl>
														<FormMessage />
													</FormItem>
												);
											}}
										/>
									</div>
									<Separator />
								</>
							)}
							<div className='space-y-4'>
								{views.map((key) => {
									const isDisabled =
										editMode &&
										((key === 'unique' && !fieldToEdit.unique) ||
											(isGeoPoint &&
												key === 'indexed' &&
												!fieldToEdit.indexed &&
												!fieldToEdit.required &&
												database.type === DATABASE.MySQL));
									return (
										<Fragment key={key}>
											<FormField
												control={form.control}
												name={`general.${key}`}
												render={({ field }) => (
													<FormItem>
														<SettingsFormItem
															as='label'
															className='py-0 space-y-0'
															contentClassName='flex items-center justify-center'
															title={t(`general.${key}`)}
															description={t(`database.fields.form.${key}_desc`)}
															twoColumns
														>
															<Switch
																disabled={isDisabled}
																checked={field.value}
																onCheckedChange={field.onChange}
															/>
														</SettingsFormItem>
														<FormMessage />
													</FormItem>
												)}
											/>
											{key === 'searchable' && languageOptions && searchableWatch && (
												<>
													<FormField
														control={form.control}
														name='general.language'
														render={({ field }) => (
															<FormItem className={cn('flex-1 flex flex-col')}>
																<FormLabel>
																	{database.type === DATABASE.MySQL
																		? t('database.fields.searchable.collation.title')
																		: t('database.fields.searchable.lang.title')}
																</FormLabel>
																<FormControl>
																	<Select
																		defaultValue={field.value}
																		value={field.value}
																		name={field.name}
																		disabled={
																			!!fieldToEdit?.text?.language ||
																			!!fieldToEdit?.richText?.language
																		}
																		onValueChange={field.onChange}
																	>
																		<FormControl>
																			<SelectTrigger className={cn('w-full input')}>
																				<SelectValue
																					className={cn('text-subtle')}
																					placeholder={
																						database.type === DATABASE.MySQL
																							? t(
																									'database.fields.searchable.collation.placeholder',
																								)
																							: t('database.fields.searchable.lang.placeholder')
																					}
																				/>
																			</SelectTrigger>
																		</FormControl>
																		<SelectContent className='max-h-[400px]'>
																			{languageOptions.map((item) => {
																				return (
																					<SelectItem
																						className='px-3 py-[6px] w-full max-w-full cursor-pointer'
																						key={item.name}
																						value={item.value}
																					>
																						<div className='flex items-center gap-2 [&>svg]:text-lg'>
																							{database.type === DATABASE.MySQL
																								? item.name
																								: capitalize(item.name)}
																						</div>
																					</SelectItem>
																				);
																			})}
																		</SelectContent>
																	</Select>
																</FormControl>
																<FormMessage />
															</FormItem>
														)}
													/>
													<Separator />
												</>
											)}
										</Fragment>
									);
								})}
								{!['object', 'object-list'].includes(TYPE) && (
									<FormField
										control={form.control}
										name='general.required'
										render={({ field }) => (
											<FormItem className='space-y-1'>
												<FormControl>
													<SettingsFormItem
														as='label'
														className='py-0 space-y-0'
														contentClassName='flex items-center justify-center'
														title={t('general.required')}
														description={t('database.fields.form.required_desc')}
														twoColumns
													>
														<Switch
															disabled={
																database.type !== DATABASE.MongoDB &&
																editMode &&
																!fieldToEdit.required
															}
															checked={field.value}
															onCheckedChange={field.onChange}
														/>
													</SettingsFormItem>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}
							</div>
							{hasDefaultValue && (
								<>
									<Separator />
									<div className='space-y-6'>
										<FormField
											control={form.control}
											name='general.defaultValue'
											render={({ field }) => (
												<FormItem className={cn('flex-1 flex flex-col ')}>
													<FormLabel>{t('database.fields.form.default_value')}</FormLabel>
													{isBoolean || isDatetime || isDate ? (
														<FormControl>
															<Select
																defaultValue={field.value}
																value={field.value}
																name={field.name}
																onValueChange={field.onChange}
															>
																<FormControl>
																	<SelectTrigger className={cn('w-full input')}>
																		<SelectValue
																			className={cn('text-subtle')}
																			placeholder={t('database.fields.select_default_value')}
																		/>
																	</SelectTrigger>
																</FormControl>
																<SelectContent align='center'>
																	{defaults.map((item) => {
																		return (
																			<SelectItem
																				className='px-3 py-[6px] w-full max-w-full cursor-pointer'
																				key={item.label}
																				value={item.value}
																			>
																				<div className='flex items-center gap-2 [&>svg]:text-lg'>
																					{item.label}
																				</div>
																			</SelectItem>
																		);
																	})}
																</SelectContent>
															</Select>
														</FormControl>
													) : (
														<FormControl className='flex-1'>
															<Input
																error={Boolean(form.formState.errors.general?.defaultValue)}
																placeholder={t('forms.placeholder', {
																	label: t('database.fields.form.default_value').toLowerCase(),
																}).toString()}
																{...field}
																onInput={field.onChange}
															/>
														</FormControl>
													)}
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								</>
							)}
							<div className='flex gap-4 justify-end'>
								<DrawerClose asChild>
									<Button variant='secondary' size='lg'>
										{t('general.cancel')}
									</Button>
								</DrawerClose>
								<Button disabled={!canCreate} size='lg' loading={isPending} type='submit'>
									{editMode ? t('general.save') : t('general.add')}
								</Button>
							</div>
						</form>
					</Form>
				</div>
			</DrawerContent>
		</Drawer>
	);
}
