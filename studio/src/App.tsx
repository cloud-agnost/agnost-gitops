import { useRealtime } from '@/hooks';
import { router } from '@/router';
import useAuthStore from '@/store/auth/authStore.ts';
import useTypeStore from '@/store/types/typeStore.ts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import _ from 'lodash';
import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from './components/Toast';
import useThemeStore from './store/theme/themeStore';
import 'ag-grid-community/styles/ag-grid.css'; // Core CSS
import 'ag-grid-community/styles/ag-theme-alpine.css'; // Theme

const queryClient = new QueryClient();

function App() {
	useRealtime();
	const { getAllTypes } = useTypeStore();
	const { accessToken, user } = useAuthStore();
	const { getTheme } = useThemeStore();

	useEffect(() => {
		if (!_.isEmpty(accessToken)) {
			getAllTypes();
		}
		if (!window.location.pathname.includes('studio')) {
			window.location.pathname = `/studio${window.location.pathname}`;
		}

		setTimeout(() => {
			document.documentElement.classList.add('has-js');
		}, 500);
	}, []);

	useEffect(() => {
		const theme = getTheme(user?._id ?? '');
		let systemTheme = theme;
		if (theme === 'system') {
			systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
		}
		document.body.classList.remove('dark', 'light');
		document.body.dataset.mode = systemTheme;
		document.body.classList.add(systemTheme);
	}, [getTheme(user?._id ?? '')]);

	return (
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
			<Toaster />
		</QueryClientProvider>
	);
}

export default App;
