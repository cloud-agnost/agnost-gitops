import { Button } from '@/components/Button';
import { CodeEditor } from '@/components/CodeEditor';
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from '@/components/Drawer';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/Form';
import { Input } from '@/components/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';
import { Switch } from '@/components/Switch';
import { useToast } from '@/hooks';
import useAuthStore from '@/store/auth/authStore';
import { APIError } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import monacoThemes from 'monaco-themes/themes/themelist.json';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';

const schema = z.object({
	fontSize: z.coerce.number().min(10).max(30).default(14),
	fontFamily: z
		.string()
		.default("'Fira Code', 'Fira Mono', 'Menlo', 'Monaco', 'Courier', monospace"),
	fontWeight: z.string().default('400'),
	tabSize: z.coerce.number().min(1).max(8).default(3),
	minimap: z.boolean().default(false),
	lineNumbers: z.enum(['on', 'off', 'relative', 'interval']).default('on'),
	wordWrap: z.enum(['on', 'off', 'wordWrapColumn', 'bounded']).default('on'),
	theme: z.string().default('iPlastic'),
	fontLigatures: z.boolean().default(true),
});

const fonts = [
	{ name: 'Courier', value: 'Courier' },
	{ name: 'DejaVu Sans Mono ', value: 'DejaVu Sans Mono' },
	{ name: 'Fira Code', value: 'Fira Code' },
	{ name: 'Hack', value: 'Hack' },
	{ name: 'Inconsolata', value: 'Inconsolata' },
	{ name: 'JetBrains Mono', value: 'JetBrains Mono' },
	{ name: 'Menlo', value: 'Menlo' },
	{ name: 'Monaco', value: 'Monaco' },
	{ name: 'Monospace', value: 'monospace' },
	{ name: 'Roboto Mono', value: 'Roboto Mono' },
	{ name: 'Source Code Pro', value: 'Source Code Pro' },
];
const word_wrap = [
	{ name: 'On', value: 'on' },
	{ name: 'Off', value: 'off' },
	{ name: 'Word wrap column', value: 'wordWrapColumn' },
	{ name: 'Bounded', value: 'bounded' },
];
const line_numbers = [
	{ name: 'On', value: 'on' },
	{ name: 'Off', value: 'off' },
	{ name: 'Relative', value: 'relative' },
	{ name: 'Interval', value: 'interval' },
];

const themes = {
	vs: 'VS',
	'vs-dark': 'VS Dark',
	...monacoThemes,
};

export default function EditorSettings() {
	const { t } = useTranslation();
	const { toast } = useToast();
	const { isEditorSettingsDrawerOpen, toggleEditorSettingsDrawer, updateEditorPreferences, user } =
		useAuthStore();
	const form = useForm({
		defaultValues: {
			fontSize: 14,
			fontFamily: 'Fira Code',
			fontWeight: '400',
			tabSize: 3,
			minimap: false,
			lineNumbers: 'on',
			wordWrap: 'on',
			theme: 'night-owl',
			fontLigatures: true,
		},
		resolver: zodResolver(schema),
	});
	const { mutateAsync: saveEditorPreferences, isPending } = useMutation({
		mutationFn: updateEditorPreferences,
		mutationKey: ['editorPreferences'],
		onSuccess: () => {
			toggleEditorSettingsDrawer();
			toast({
				title: t('profileSettings.editor.success') as string,
				action: 'success',
			});
		},
		onError: (error: APIError) => {
			toast({
				title: error.details,
				action: 'error',
			});
		},
	});
	const onSubmit = (data: any) => {
		saveEditorPreferences({
			...data,
			minimap: {
				enabled: data.minimap,
			},
		});
	};

	function closeDrawer() {
		form.reset();
		globalThis?.monaco?.editor.setTheme(user?.editorSettings?.theme ?? 'night-owl');
		toggleEditorSettingsDrawer();
	}

	useEffect(() => {
		if (isEditorSettingsDrawerOpen && user?.editorSettings) {
			form.reset({
				...user?.editorSettings,
				minimap: user?.editorSettings.minimap?.enabled,
				lineNumbers: user?.editorSettings.lineNumbers as any,
				fontLigatures: user?.editorSettings.fontLigatures as any,
			});
		}
	}, [isEditorSettingsDrawerOpen]);

	return (
		<Drawer open={isEditorSettingsDrawerOpen} onOpenChange={closeDrawer}>
			<DrawerContent position='right' size='lg' className='h-full'>
				<DrawerHeader>
					<DrawerTitle>{t('profileSettings.editor.title')}</DrawerTitle>
				</DrawerHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className='p-6 h-[calc(100%-97px)] overflow-auto space-y-4 grid grid-rows-[auto_1fr_auto] gap-4'
					>
						<div className='space-y-6'>
							<div className='grid grid-cols-3 gap-4'>
								<FormField
									control={form.control}
									name='fontFamily'
									render={({ field }) => (
										<FormItem className='flex-1'>
											<FormLabel>{t('profileSettings.editor.font_family')}</FormLabel>
											<FormControl>
												<Select
													defaultValue={field.value}
													value={field.value}
													name={field.name}
													onValueChange={field.onChange}
												>
													<FormControl>
														<SelectTrigger className='w-full'>
															<SelectValue placeholder={`${t('general.select')} `} />
														</SelectTrigger>
													</FormControl>
													<SelectContent align='center' className='!max-h-[26rem]'>
														{fonts.map((font) => (
															<SelectItem key={font.name} value={font.value}>
																{font.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name='fontSize'
									render={({ field }) => {
										return (
											<FormItem className='flex-1'>
												<FormLabel>{t('profileSettings.editor.font_size')}</FormLabel>
												<FormControl>
													<Input
														type='number'
														error={!!form.formState.errors.fontSize}
														placeholder={t('profileSettings.editor.font_size').toString()}
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										);
									}}
								/>
								<FormField
									control={form.control}
									name='theme'
									render={({ field }) => (
										<FormItem className='flex-1'>
											<FormLabel>{t('profileSettings.editor.editor_theme')}</FormLabel>
											<FormControl>
												<Select
													defaultValue={field.value}
													value={field.value}
													name={field.name}
													onValueChange={field.onChange}
												>
													<FormControl>
														<SelectTrigger className='w-full'>
															<SelectValue placeholder={`${t('general.select')} `} />
														</SelectTrigger>
													</FormControl>
													<SelectContent
														align='center'
														className='!max-h-[36rem] [&_.select-viewport]:!overflow-visible'
													>
														{Object.entries(themes).map(([key, theme]) => (
															<SelectItem key={key} value={key}>
																{theme}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</FormControl>

											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className='grid grid-cols-3 gap-4'>
								<FormField
									control={form.control}
									name='tabSize'
									render={({ field }) => {
										return (
											<FormItem>
												<FormLabel>{t('profileSettings.editor.tab_size')}</FormLabel>
												<FormControl>
													<Input
														type='number'
														error={!!form.formState.errors.tabSize}
														placeholder={t('profileSettings.editor.tab_size').toString()}
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										);
									}}
								/>
								<FormField
									control={form.control}
									name='lineNumbers'
									render={({ field }) => (
										<FormItem className='flex-1'>
											<FormLabel>{t('profileSettings.editor.line_numbers')}</FormLabel>
											<FormControl>
												<Select
													defaultValue={field.value}
													value={field.value}
													name={field.name}
													onValueChange={field.onChange}
												>
													<FormControl>
														<SelectTrigger className='w-full'>
															<SelectValue placeholder={`${t('general.select')} `} />
														</SelectTrigger>
													</FormControl>
													<SelectContent align='center'>
														{line_numbers.map((lm) => (
															<SelectItem key={lm.name} value={lm.value}>
																{lm.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</FormControl>

											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name='wordWrap'
									render={({ field }) => (
										<FormItem className='flex-1'>
											<FormLabel>{t('profileSettings.editor.word_wrap')}</FormLabel>
											<FormControl>
												<Select
													defaultValue={field.value}
													value={field.value}
													name={field.name}
													onValueChange={field.onChange}
												>
													<FormControl>
														<SelectTrigger className='w-full'>
															<SelectValue placeholder={`${t('general.select')} `} />
														</SelectTrigger>
													</FormControl>
													<SelectContent align='center'>
														{word_wrap.map((wrap) => (
															<SelectItem key={wrap.name} value={wrap.value}>
																{wrap.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<FormField
								control={form.control}
								name='minimap'
								render={({ field }) => (
									<FormItem className='flex justify-between gap-4 items-center space-y-0'>
										<FormLabel>
											<p>{t('profileSettings.editor.minimap')}</p>
											<p className='text-subtle'>{t('profileSettings.editor.minimap_desc')}</p>
										</FormLabel>
										<FormControl>
											<Switch checked={field.value} onCheckedChange={field.onChange} />
										</FormControl>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name='fontLigatures'
								render={({ field }) => (
									<FormItem className='flex justify-between gap-4 items-center space-y-0'>
										<FormLabel>
											<p>{t('profileSettings.editor.font_ligatures')}</p>
											<p className='text-subtle'>
												{t('profileSettings.editor.font_ligatures_desc')}
											</p>
										</FormLabel>
										<FormControl>
											<Switch checked={field.value} onCheckedChange={field.onChange} />
										</FormControl>
									</FormItem>
								)}
							/>
						</div>

						<CodeEditor
							name='editor'
							containerClassName='h-full'
							className='[&_.overflow-guard]:!h-full [&>:first-child]:!h-full'
							value={`
// This function calculates the sum of two numbers
const sum(a, b) => {
  // Return the sum of a and b
  return a + b;
}

// Declare two numbers
let num1 = 5;
let num2 = 10;

// Calculate the sum of num1 and num2
let total = sum(num1, num2);

// Log the result to the console
console.log('total:', total);
`}
							options={{
								readOnly: true,
								fontSize: form.watch('fontSize'),
								fontFamily: form.watch('fontFamily'),
								fontWeight: form.watch('fontWeight'),
								tabSize: form.watch('tabSize'),
								minimap: {
									enabled: form.watch('minimap'),
								},
								lineNumbers: form.watch('lineNumbers') as monaco.editor.LineNumbersType,
								wordWrap: form.watch('wordWrap') as 'on' | 'off' | 'wordWrapColumn' | 'bounded',
								theme: form.watch('theme'),
								fontLigatures: form.watch('fontLigatures'),
							}}
						/>

						<DrawerFooter className='mt-8 flex justify-end'>
							<DrawerClose asChild>
								<Button variant='secondary' size='lg'>
									{t('general.cancel')}
								</Button>
							</DrawerClose>
							<Button className='ml-2' type='submit' size='lg' loading={isPending}>
								{t('general.save')}
							</Button>
						</DrawerFooter>
					</form>
				</Form>
			</DrawerContent>
		</Drawer>
	);
}
