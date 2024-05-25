import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { CopyButton } from '@/components/CopyButton';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/Drawer';
import { Form } from '@/components/Form';
import { Input } from '@/components/Input';
import { Resizer } from '@/components/Resizer';
import { BASE_URL, HTTP_METHOD_BADGE_MAP, TEST_ENDPOINTS_MENU_ITEMS } from '@/constants';
import { useToast } from '@/hooks';
import useEndpointStore from '@/store/endpoint/endpointStore';
import useEnvironmentStore from '@/store/environment/environmentStore';
import useUtilsStore from '@/store/version/utilsStore';
import { APIError, TestMethods } from '@/types';
import {
	cn,
	generateId,
	getEndpointPath,
	getPathParams,
	joinChannel,
	leaveChannel,
	serializedStringToFile,
} from '@/utils';

import { APIServerAlert } from '@/components/APIServerAlert';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Panel, PanelGroup } from 'react-resizable-panels';
import { useSearchParams } from 'react-router-dom';
import * as z from 'zod';
import { OrganizationMenuItem } from '../organization';
import EndpointBody from './TestEndpoint/EndpointBody';
import EndpointHeaders from './TestEndpoint/EndpointHeaders';
import EndpointParams from './TestEndpoint/EndpointParams';
import EndpointPathVariables from './TestEndpoint/EndpointPathVariables';
import EndpointResponse from './TestEndpoint/EndpointResponse';
import TestEndpointSettings from './TestEndpoint/TestEndpointSettings';
interface TestEndpointProps {
	open: boolean;
	onClose: () => void;
}

export const TestEndpointSchema = z.object({
	params: z.object({
		queryParams: z.array(
			z.object({
				key: z.string(),
				value: z.string(),
			}),
		),
		pathVariables: z
			.array(
				z.object({
					key: z.string(),
					value: z.string(),
				}),
			)
			.optional(),
	}),
	bodyType: z.enum(['json', 'form-data']).default('json'),
	headers: z
		.array(
			z.object({
				key: z.string(),
				value: z.string(),
			}),
		)
		.optional(),
	body: z.string().optional().default('{}'),
	formData: z
		.array(
			z.object({
				type: z.enum(['text', 'file']),
				key: z.string(),
				value: z.string().optional(),
				file: z.instanceof(File).optional(),
			}),
		)
		.optional(),
});

export default function TestEndpoint({ open, onClose }: TestEndpointProps) {
	const { t } = useTranslation();
	const { toast } = useToast();
	const { environment } = useEnvironmentStore();
	const { endpoint, testEndpoint, tokens } = useEndpointStore();
	const { endpointRequest } = useUtilsStore();
	const [searchParams, setSearchParams] = useSearchParams();
	const [debugChannel, setDebugChannel] = useState<string | null>('');

	const form = useForm<z.infer<typeof TestEndpointSchema>>({
		resolver: zodResolver(TestEndpointSchema),
		defaultValues: {
			headers: [
				{
					key: 'Content-Type',
					value: 'application/json',
				},
				{
					key: 'Authorization',
					value: '',
				},
				{
					key: 'Session',
					value: '',
				},
			],
			bodyType: 'json',
			body: '{}',
		},
	});
	const {
		mutateAsync: testEndpointMutate,
		isPending,
		reset,
	} = useMutation({
		mutationFn: testEndpoint,
		onError: ({ details }: APIError) => {
			toast({
				title: details,
				action: 'error',
			});
		},
	});
	async function onSubmit(data: z.infer<typeof TestEndpointSchema>) {
		const testPath = getEndpointPath(endpoint?.path, data.params.pathVariables ?? []);
		if (debugChannel) leaveChannel(debugChannel);
		const id = generateId();
		setDebugChannel(id);
		joinChannel(id);
		const controller = new AbortController();
		const headers = data.headers?.map((h) => {
			if (h.key === 'Authorization' && !h.value) {
				return {
					key: h.key,
					value: tokens.accessToken,
				};
			}
			if (h.key === 'Session' && !h.value) {
				return {
					key: h.key,
					value: tokens.sessionToken,
				};
			}
			return h;
		});
		testEndpointMutate({
			epId: endpoint?._id,
			envId: environment?.iid,
			path: testPath,
			consoleLogId: id,
			method: endpoint?.method.toLowerCase() as TestMethods,
			params: data.params,
			headers: headers?.filter((h) => h.key && h.value),
			body: data.body ?? {},
			formData: data.formData,
			bodyType: data.bodyType,
			signal: controller?.signal,
		});

		return () => {
			reset();
			controller.abort();
		};
	}

	function handleClose() {
		leaveChannel(debugChannel as string);
		setDebugChannel(null);
		onClose();
		handleCancelRequest();
		form.reset();
	}

	function handleCancelRequest() {
		reset();
		leaveChannel(debugChannel as string);
		setDebugChannel(null);
	}

	useEffect(() => {
		const header = {
			key: 'Content-Type',
			value:
				form.getValues('bodyType') === 'form-data' ? 'multipart/form-data' : 'application/json',
		};

		form.setValue('headers', [header]);
	}, [form.getValues('bodyType')]);

	useEffect(() => {
		const req = endpointRequest?.[endpoint?._id];
		if (req) {
			form.reset({
				params: {
					queryParams: req.params.queryParams,
					pathVariables: req.params.pathVariables,
				},
				headers: req.headers,
				body: req.body,
				formData: req?.formData?.map((f) => ({
					...f,
					...(f.type === 'file' && { file: serializedStringToFile(f.value as string, f.key) }),
				})),
				bodyType: req.bodyType,
			});
		} else {
			form.reset({
				params: {
					queryParams: [],
					pathVariables: [],
				},
				headers: [
					{
						key: 'Content-Type',
						value: 'application/json',
					},
					{
						key: 'Authorization',
						value: '',
					},
					{
						key: 'Session',
						value: '',
					},
				],
				bodyType: 'json',
				body: JSON.stringify({}),
				formData: [],
			});
		}
	}, [endpointRequest?.[endpoint?._id]]);

	useEffect(() => {
		if (!searchParams.get('t') && open) {
			searchParams.set('t', 'params');
			setSearchParams(searchParams);
		}
	}, [searchParams.get('t'), open]);

	return (
		<Drawer open={open} onOpenChange={handleClose}>
			<DrawerContent position='right' size='lg' className={cn('h-full flex [&>*]:w-full flex-col')}>
				<DrawerHeader>
					<DrawerTitle>{t('endpoint.test.title')}</DrawerTitle>
				</DrawerHeader>
				<div>
					<APIServerAlert />
					<div className='flex items-center px-5 my-6 space-x-2'>
						<div className='flex items-center flex-1'>
							<div className='w-16 !h-[30px]'>
								<Badge
									className='w-full h-full rounded-none rounded-l'
									variant={HTTP_METHOD_BADGE_MAP[endpoint.method]}
									text={endpoint.method}
								/>
							</div>
							<div className='relative flex-1 flex flex-col items-center justify-center'>
								<Input
									className='rounded-none rounded-r w-full !bg-base'
									value={endpoint.path}
									disabled
									variant='sm'
								/>
								<CopyButton
									text={`${BASE_URL}/${environment?.iid}${endpoint.path}`}
									className='absolute right-1'
								/>
							</div>
						</div>

						{isPending ? (
							<Button
								className='ml-3 !pointer-events-auto !cursor-pointer'
								variant='secondary'
								onClick={handleCancelRequest}
								disabled={environment?.serverStatus !== 'OK'}
								loading={isPending}
							>
								{t('endpoint.test.abort')}
							</Button>
						) : (
							<Button
								className='ml-3'
								variant='primary'
								onClick={() => form.handleSubmit(onSubmit)()}
								loading={isPending}
								disabled={environment?.serverStatus !== 'OK'}
							>
								{t('endpoint.test.send')}
							</Button>
						)}
						<TestEndpointSettings ctx={form} />
					</div>
					<nav className='flex border-b'>
						{TEST_ENDPOINTS_MENU_ITEMS.filter(
							(t) => !t.isPath || !!getPathParams(endpoint?.path).length,
						)
							.filter((t) => t.allowedMethods?.includes(endpoint?.method))
							.map((item) => {
								return (
									<OrganizationMenuItem
										key={item.name}
										item={item}
										active={window.location.search.includes(item.href)}
									/>
								);
							})}
					</nav>
				</div>
				<Form {...form}>
					<PanelGroup className='p-6' direction='vertical' autoSaveId={endpoint._id}>
						<Panel defaultSize={32} className='max-h-full !overflow-y-auto' minSize={20}>
							<div
								className={cn(
									'h-full',
									searchParams.get('t') === 'body' &&
										form.watch('bodyType') === 'json' &&
										'overflow-hidden',
								)}
							>
								<form className={cn('space-y-6', searchParams.get('t') === 'body' && 'h-full')}>
									{searchParams.get('t') === 'params' && <EndpointParams />}
									{searchParams.get('t') === 'variables' &&
										!!getPathParams(endpoint?.path).length && <EndpointPathVariables />}
									{searchParams.get('t') === 'headers' && <EndpointHeaders />}
									{searchParams.get('t') === 'body' && <EndpointBody />}
								</form>
							</div>
						</Panel>
						<Resizer className='my-6' orientation='horizontal' />
						<Panel minSize={30}>
							<EndpointResponse className='h-full' editorClassName='h-full' loading={isPending} />
						</Panel>
					</PanelGroup>
				</Form>
			</DrawerContent>
		</Drawer>
	);
}
