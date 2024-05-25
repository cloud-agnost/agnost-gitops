import { Button } from '@/components/Button';
import { copyToClipboard } from '@/utils';
import { Copy } from '@phosphor-icons/react';

interface CopyButtonProps {
	text: string;
	className?: string;
}
export default function CopyButton({ text, className }: CopyButtonProps) {
	return (
		<Button
			onClick={() => copyToClipboard(text)}
			className={className}
			variant='icon'
			size='sm'
			rounded
		>
			<Copy size={14} className='flex-1' />
		</Button>
	);
}
