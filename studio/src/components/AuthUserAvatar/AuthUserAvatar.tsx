import useAuthStore from '@/store/auth/authStore.ts';
import { Avatar, AvatarFallback, AvatarImage, AvatarProps } from 'components/Avatar';

export default function AuthUserAvatar(props: AvatarProps) {
	const { user } = useAuthStore();

	return (
		<Avatar {...props}>
			<AvatarImage src={user?.pictureUrl as string} />
			<AvatarFallback isUserAvatar color={user?.color as string} name={user?.name} />
		</Avatar>
	);
}
