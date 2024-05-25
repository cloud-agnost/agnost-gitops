import { ReactNode } from 'react';
import { DATE_FORMAT_MONTH_DAY_YEAR, TIME_FORMAT, cn, formatDate } from '@/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../Avatar';
import { OrganizationMember } from '@/types';
interface DateTextProps {
	date: string | Date;
	children?: ReactNode;
	className?: string;
	user?: OrganizationMember;
	style?: React.CSSProperties;
}
export default function DateText({ date, children, className, user, ...props }: DateTextProps) {
	return (
		<div className={cn('flex items-center gap-2 whitespace-nowrap', className)} {...props}>
			{children}
			{user && (
				<Avatar size='sm'>
					<AvatarImage src={user.member.pictureUrl} />
					<AvatarFallback isUserAvatar color={user.member?.color} name={user.member?.name} />
				</Avatar>
			)}
			{date ? (
				<div>
					<p className='block text-default text-xs'>
						{formatDate(date, DATE_FORMAT_MONTH_DAY_YEAR)}
					</p>
					<time className='text-[11px] text-subtle'>{formatDate(date, TIME_FORMAT)}</time>
				</div>
			) : (
				<div className='text-default text-sm leading-6'>-</div>
			)}
		</div>
	);
}
