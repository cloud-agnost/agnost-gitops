import { cn } from '@/utils';

interface LoadingProps {
	className?: string;
	loading?: boolean;
}
export default function Loading({ className, loading = true }: LoadingProps) {
	return (
		<div
			className={cn(
				'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10',
				'flex space-x-6 justify-center items-center h-screen ',
				className,
			)}
		>
			{loading && (
				<>
					<span className='sr-only'>Loading...</span>
					<div className='size-5 bg-brand-primary rounded-full animate-bounce [animation-delay:-0.3s]' />
					<div className='size-5 bg-brand-primary rounded-full animate-bounce [animation-delay:-0.15s]' />
					<div className='size-5 bg-brand-primary rounded-full animate-bounce' />
				</>
			)}
		</div>
	);
}
