import { HTTP_METHOD_BADGE_MAP } from '@/constants';
import { HttpMethod } from '@/types';
import { Badge } from '../Badge';
import { cn } from '@/utils';

export default function MethodBadge({
	method,
	className,
}: {
	method: HttpMethod;
	className?: string;
}) {
	return (
		<Badge
			variant={HTTP_METHOD_BADGE_MAP[method]}
			text={method}
			className={cn(className, 'min-w-[52px]')}
		/>
	);
}
