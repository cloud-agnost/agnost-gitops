import { LoaderFunctionArgs, redirect } from 'react-router-dom';

async function changePasswordWithTokenLoader({ request }: LoaderFunctionArgs) {
	const token = new URL(request.url).searchParams.get('token');
	if (!token) {
		return redirect('/login');
	}

	return token;
}

async function confirmChangeEmailLoader({ request }: LoaderFunctionArgs) {
	const token = new URL(request.url).searchParams.get('token');
	if (!token) {
		return redirect('/login');
	}

	return { props: {} };
}

export default {
	changePasswordWithTokenLoader,
	confirmChangeEmailLoader,
};
