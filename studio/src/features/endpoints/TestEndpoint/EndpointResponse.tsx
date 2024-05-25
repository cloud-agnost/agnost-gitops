import { CodeEditor } from '@/components/CodeEditor';
import { EmptyState } from '@/components/EmptyState';
import { Logs } from '@/components/Log';
import { TableCell, TableRow } from '@/components/Table';
import { Tabs, TabsList, TabsTrigger } from '@/components/Tabs';
import { ENDPOINT_RESPONSE_TABS } from '@/constants';
import useEndpointStore from '@/store/endpoint/endpointStore';
import useUtilsStore from '@/store/version/utilsStore';
import { Log, TabTypes } from '@/types';
import { cn, objToArray } from '@/utils';
import { TabsContent } from '@radix-ui/react-tabs';
import { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import TestEndpointTable from './TestEndpointTable';

interface EndpointResponseProps {
	className?: string;
	style?: CSSProperties;
	editorClassName?: string;
	loading?: boolean;
}

export default function EndpointResponse(props: EndpointResponseProps) {
	const { t } = useTranslation();
	const { endpoint } = useEndpointStore();
	const { endpointResponse, endpointLogs } = useUtilsStore();
	const response = endpointResponse?.[endpoint?._id];
	const logs = endpointLogs?.[endpoint?._id];

	function getStatusClass(status: number) {
		if (status >= 200 && status < 300) return 'text-green-500';
		if (status >= 300 && status < 400) return 'text-yellow-500';
		if (status >= 400 && status < 500) return 'text-red-500';
		if (status >= 500 && status < 600) return 'text-red-500';
		return 'text-default';
	}

	return (
		<Tabs style={props.style} defaultValue='body' className={cn(props.className)}>
			<div className='flex items-center pb-6 justify-between'>
				<TabsList defaultValue='body' align='center' className='flex-1' containerClassName='!p-0'>
					{ENDPOINT_RESPONSE_TABS.map((tab) => (
						<TabsTrigger key={tab.id} id={tab.id} value={tab.id} className='flex-1'>
							{tab.name}
						</TabsTrigger>
					))}
				</TabsList>
				{response?.status && response?.duration && !props.loading && (
					<div className='flex items-center gap-4'>
						<div className='text-xs text-default'>
							{t('endpoint.status')}
							<span className={cn('ml-2', getStatusClass(response?.status))}>
								{response?.status}
							</span>
						</div>
						{response?.duration && (
							<div className='text-xs text-default'>
								{t('endpoint.duration')}
								<span className={cn('ml-2', getStatusClass(response?.status))}>
									{response?.duration}
								</span>
							</div>
						)}
					</div>
				)}
			</div>

			<TabsContent value='body' className='h-full'>
				<CodeEditor
					containerClassName='h-[calc(100%-4rem)]'
					className={cn(props.editorClassName)}
					value={JSON.stringify(response?.data, null, 2)}
					defaultLanguage='json'
					readonly
					name={`endpointResponse-${endpoint?._id}`}
				/>
			</TabsContent>
			<TabsContent value='cookies' className='overflow-y-auto h-[calc(100%-4rem)]'>
				{response?.headers ? (
					<TestEndpointTable containerClassName='h-auto'>
						{objToArray(response?.cookies).map((header) => (
							<TableRow key={header.value}>
								<TableCell>{header.key}</TableCell>
								<TableCell>{header.value}</TableCell>
							</TableRow>
						))}
					</TestEndpointTable>
				) : (
					<EmptyState title={t('endpoint.no_cookies')} type={TabTypes.Endpoint} />
				)}
			</TabsContent>
			<TabsContent value='headers' className='h-[calc(100%-4rem)]'>
				<div className='h-full overflow-y-auto'>
					{response?.headers ? (
						<TestEndpointTable containerClassName='h-auto'>
							{objToArray(response?.headers).map((header) => (
								<TableRow key={header.value}>
									<TableCell>{header.key}</TableCell>
									<TableCell>{header.value}</TableCell>
								</TableRow>
							))}
						</TestEndpointTable>
					) : (
						<EmptyState title={t('endpoint.no_headers')} type={TabTypes.Endpoint} />
					)}
				</div>
			</TabsContent>
			<TabsContent value='console' className='h-[calc(100%-4rem)]'>
				<Logs logs={logs as Log[]} />
			</TabsContent>
		</Tabs>
	);
}
