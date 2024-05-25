import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
	application,
	cache,
	cluster,
	container,
	database,
	endpoint,
	forms,
	func,
	general,
	login,
	onboarding,
	organization,
	profileSettings,
	project,
	queue,
	resources as rs,
	storage,
	task,
	version,
} from './en';

export const resources = {
	en: {
		translation: {
			login,
			database,
			queue,
			forms,
			general,
			organization,
			profileSettings,
			application,
			onboarding,
			version,
			resources: rs,
			endpoint,
			task,
			storage,
			cache,
			function: func,
			cluster,
			project,
			container,
		},
	},
};

i18next
	.use(initReactI18next)
	.init({
		lng: 'en', // if you're using a language detector, do not define the lng option
		debug: true,
		resources,
		defaultNS: 'translation',
	})
	.catch(console.error);

export const { t } = i18next;

export default i18next;
