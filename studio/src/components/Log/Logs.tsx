import { BADGE_COLOR_MAP } from '@/constants';
import { Log } from '@/types';
import { Badge } from '../Badge';
import { cn } from '@/utils';
import { useTranslation } from 'react-i18next';
interface LogsProps {
	logs: Log[];
	className?: string;
}

export default function Logs({ logs, className }: LogsProps) {
	const { t } = useTranslation();
	function parseJSON(str: string) {
		try {
			return JSON.stringify(JSON.parse(str), null, 2);
		} catch (e) {
			return str;
		}
	}

	return (
		<div
			className={cn(
				'overflow-auto h-full bg-base whitespace-pre text-default text-sm font-mono',
				className,
			)}
		>
			{logs?.length ? (
				logs?.map((log, index) => (
					<div key={index} className='flex items-start gap-4  px-4 py-2'>
						<small>{log.timestamp}</small>
						{log.pod && <p className='text-xs text-default max-w-96'>{log.pod}</p>}
						{log.type && (
							<Badge
								className='w-10 flex-shrink-0 p-0'
								variant={BADGE_COLOR_MAP[log.type.toUpperCase()]}
								text={log.type}
							/>
						)}
						<pre className='text-xs'>{parseJSON(log.message)}</pre>
					</div>
				))
			) : (
				<div className='flex items-center justify-center h-full w-full'>
					<p className='text-xs'>{t('general.no_console_logs')}</p>
				</div>
			)}
		</div>
	);
}
