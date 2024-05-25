import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/Table';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils';
interface TestEndpointTableProps {
	children: React.ReactNode;
	isFormData?: boolean;
	containerClassName?: string;
	className?: string;
}

export default function TestEndpointTable({
	children,
	isFormData = false,
	className,
	containerClassName,
}: TestEndpointTableProps) {
	const { t } = useTranslation();
	return (
		<Table
			className={cn('h-full', className)}
			containerClassName={cn('h-full', containerClassName)}
		>
			<TableHeader>
				<TableRow className='head bg-wrapper-background-light'>
					{isFormData && <TableHead>{t('general.type')} </TableHead>}
					<TableHead>{t('endpoint.test.key')}</TableHead>
					<TableHead>{t('endpoint.test.value')}</TableHead>
					<TableHead>{t('general.actions')}</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>{children}</TableBody>
		</Table>
	);
}
