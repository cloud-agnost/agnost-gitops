import { cn } from '@/utils';
import AnsiToHtml from 'ansi-to-html';
import { useEffect, useState } from 'react';

const LogViewer = ({ logs, className }: { logs: string[]; className?: string }) => {
	const [htmlLogs, setHtmlLogs] = useState('');

	useEffect(() => {
		const convert = new AnsiToHtml();
		const html = logs.map((log) => convert.toHtml(log)).join('<br/>');
		setHtmlLogs(html);
	}, [logs]);

	return (
		<div
			className={cn('log-viewer bg-gray-900 text-gray-100 p-4 overflow-auto text-xs', className)}
		>
			<div dangerouslySetInnerHTML={{ __html: htmlLogs }} className='whitespace-nowrap' />
		</div>
	);
};

export default LogViewer;
