import { Error, SuccessCheck } from '@/components/icons';
import { cn } from '@/utils';
interface Props {
	success?: boolean;
	title: string;
	description: string;
	className?: string;
}
export default function Feedback({ success, title, description, className }: Props) {
	const Icon = success ? SuccessCheck : Error;
	return (
		<div className={cn('flex flex-col items-center p-8 space-y-4 text-center', className)}>
			<Icon className='h-16 w-16' />
			<h2 className='text-sm font-semibold text-default'>{title}</h2>
			<p className='text-subtle text-xs'>{description}</p>
		</div>
	);
}
