import { cn } from '@/utils';
import { Logo } from '../icons';

type Props = {
	className?: string;
};
export default function AgnostLogo({ className }: Props) {
	return <Logo className={cn('w-48 h-10 ', className)} />;
}
