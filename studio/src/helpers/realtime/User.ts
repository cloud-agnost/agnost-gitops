import useAuthStore from '@/store/auth/authStore';
import { RealtimeActionParams, User as UserType } from '@/types';
import { RealtimeActions } from './RealtimeActions';
class User implements RealtimeActions<UserType> {
	update({ data }: RealtimeActionParams<UserType>) {
		useAuthStore.setState({ user: data });
	}
}

export default User;
