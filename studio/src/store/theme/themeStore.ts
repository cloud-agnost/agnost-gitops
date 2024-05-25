import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface ThemeStore {
	theme: Record<string, string>;
	setTheme: (theme: string, userId: string) => void;
	getTheme: (userId: string) => string;
}

const useThemeStore = create<ThemeStore>()(
	devtools(
		persist(
			(set, get) => ({
				theme: {},
				setTheme: (theme, userId) => {
					document.body.classList.remove(get().theme[userId]);
					document.body.classList.add(theme);
					set({
						theme: {
							[userId]: theme,
						},
					});
				},
				getTheme: (userId) => get().theme[userId] ?? 'dark',
			}),

			{
				name: 'theme-store',
			},
		),
	),
);

export default useThemeStore;
