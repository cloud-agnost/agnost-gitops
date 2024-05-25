import { Toast, ToastProvider, ToastTitle, ToastViewport } from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/utils';
import { Check, X } from '@phosphor-icons/react';
import { Button } from '../Button';

export function Toaster() {
	const { toasts } = useToast();
	const { dismiss } = useToast();
	return (
		<ToastProvider duration={2500}>
			{toasts.map(function ({ id, title, action, ...props }) {
				return (
					<Toast
						key={id}
						{...props}
						className={cn(action === 'success' ? 'bg-surface-green' : 'bg-surface-red')}
					>
						<div
							className={cn(
								action === 'success' ? 'bg-elements-strong-green' : 'bg-elements-red',
								'h-5 w-5 rounded-full flex items-center justify-center text-default',
							)}
						>
							{action === 'success' && <Check size={14} weight='bold' color='white' />}
							{action === 'error' && <X size={14} color='white' />}
						</div>
						{title && <ToastTitle className='flex-1'>{title}</ToastTitle>}
						<Button
							rounded
							variant='icon'
							size='sm'
							onClick={() => dismiss(id)}
							className='!h-[unset] !p-1 opacity-0 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-hover:bg-transparent group-hover:ring-transparent'
						>
							<X size={12} />
						</Button>
					</Toast>
				);
			})}
			<ToastViewport />
		</ToastProvider>
	);
}
