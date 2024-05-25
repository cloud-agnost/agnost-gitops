import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	base: '/studio',
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src/'),
			routes: `${path.resolve(__dirname, './src/routes/')}`,
			services: `${path.resolve(__dirname, './src/services/')}`,
			utils: `${path.resolve(__dirname, './src/utils/')}`,
			components: `${path.resolve(__dirname, './src/components/')}`,
			constants: `${path.resolve(__dirname, './src/constants/')}`,
			'˜': `${path.resolve(__dirname, './src/assets/')}`,
		},
	},
	server: {
		port: 4000,
		host: true,
	},
});
