import { fontFamily } from 'tailwindcss/defaultTheme';
/** @type {import('tailwindcss').Config} */
// @filename tailwind.config.js
module.exports = {
	darkMode: ['class', '[data-mode="dark"]'],
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			height: {
				7: 'var(--base-height)',
			},
			colors: {
				brand: {
					primary: 'rgb(var(--brand-color-primary) / <alpha-value>)',
					darker: 'rgb(var(--brand-color-primary--darker) / <alpha-value>)',
				},
				elements: {
					'strong-blue': 'rgb(var(--elements-strong--blue) / <alpha-value>)',
					blue: 'rgb(var(--elements-blue) / <alpha-value>)',
					'subtle-blue': 'rgb(var(--elements-subtle-blue) / <alpha-value>)',

					'strong-green': 'rgb(var(--elements-strong-green) / <alpha-value>)',
					green: 'rgb(var(--elements-green) / <alpha-value>)',
					'subtle-green': 'rgb(var(--elements-subtle-green) / <alpha-value>)',

					'strong-yellow': 'rgb(var(--elements-strong-yellow) / <alpha-value>)',
					yellow: 'rgb(var(--elements-yellow) / <alpha-value>)',
					'subtle-yellow': 'rgb(var(--elements-subtle-yellow) / <alpha-value>)',

					'strong-purple': 'rgb(var(--elements-strong-purple) / <alpha-value>)',
					purple: 'rgb(var(--elements-purple) / <alpha-value>)',
					'subtle-purple': 'rgb(var(--elements-subtle-purple) / <alpha-value>)',

					'strong-red': 'rgb(var(--elements-strong-red) / <alpha-value>)',
					red: 'rgb(var(--elements-red) / <alpha-value>)',
					'subtle-red': 'rgb(var(--elements-subtle-red) / <alpha-value>)',

					'strong-orange': 'rgb(var(--elements-strong-orange) / <alpha-value>)',
					orange: 'rgb(var(--elements-orange) / <alpha-value>)',
					'subtle-orange': 'rgb(var(--elements-subtle-orange) / <alpha-value>)',
				},
				success: 'rgb(var(--success) / <alpha-value>)',
				error: 'rgb(var(--error) / <alpha-value>)',
				border: 'rgb(var(--theme-border) / <alpha-value>)',
				'border-hover': 'rgb(var(--theme-border-hover) / <alpha-value>)',
				database: 'rgb(var(--database) / <alpha-value>)',
				cache: 'rgb(var(--cache) / <alpha-value>)',
				storage: 'rgb(var(--storage) / <alpha-value>)',
				endpoint: 'rgb(var(--endpoint) / <alpha-value>)',
				middleware: 'rgb(var(--middleware) / <alpha-value>)',
				function: 'rgb(var(--function) / <alpha-value>)',
				queue: 'rgb(var(--queue) / <alpha-value>)',
				task: 'rgb(var(--task) / <alpha-value>)',

				icon: {
					secondary: 'rgb(var(--icon-secondary) / <alpha-value>)',
					base: 'rgb(var(--icon-base) / <alpha-value>)',
					disabled: 'rgb(var(--icon-disabled) / <alpha-value>)',
					'secondary-reverse': 'rgb(var(--icon-secondary-reverse) / <alpha-value>)',
					'base-reverse': 'rgb(var(--icon-base-reverse) / <alpha-value>)',
					'disabled-reverse': 'rgb(var(--icon-disabled-reverse) / <alpha-value>)',
				},

				input: {
					background: 'rgb(var(--form-input-base-background) / <alpha-value>)',
					border: 'rgb(var(--form-input-base-border) / <alpha-value>)',
					hover: 'rgb(var(--form-input-hover) / <alpha-value>)',
					focus: 'rgb(var(--form-input-focus) / <alpha-value>)',
					'disabled-background': 'rgb(var(--form-input-disabled-background) / <alpha-value>)',
					'disabled-border': 'rgb(var(--form-input-disabled-border) / <alpha-value>)',
				},
				button: {
					primary: 'rgb(var(--button-background-base-primary) / <alpha-value>)',
					'primary-hover': 'rgb(var(--button-background-hover-primary) / <alpha-value>)',
					secondary: 'rgb(var(--button-background-base-secondary) / <alpha-value>)',
					'secondary-hover': 'rgb(var(--button-background-hover-secondary) / <alpha-value>)',
					border: 'rgb(var(--button-border-base) / <alpha-value>)',
					'border-hover': 'rgb(var(--button-border-hover) / <alpha-value>)',
					'border-disabled': 'rgb(var(--button-border-disabled) / <alpha-value>)',
					disabled: 'rgb(var(--button-background-disabled) / <alpha-value>)',
				},
				surface: {
					green: 'rgb(var(--surface-green) / <alpha-value>)',
					yellow: 'rgb(var(--surface-yellow) / <alpha-value>)',
					red: 'rgb(var(--surface-red) / <alpha-value>)',
				},
				wrapper: {
					'background-base': 'rgb(var(--wrapper-background-base) / <alpha-value>)',
					'background-hover': 'rgb(var(--wrapper-background-hover) / <alpha-value>)',
					'background-light': 'rgb(var(--wrapper-background-light) / <alpha-value>)',
					border: 'rgb(var(--wrapper-menu-border) / <alpha-value>)',
				},
				text: {
					default: 'rgb(var(--text-base) / <alpha-value>)',
					subtle: 'rgb(var(--text-subtle) / <alpha-value>)',
					disabled: 'rgb(var(--text-disabled) / <alpha-value>)',
					'default-reverse': 'rgb(var(--text-base-reverse) / <alpha-value>)',
					'subtle-reverse': 'rgb(var(--text-subtle-reverse) / <alpha-value>)',
					'disabled-reverse': 'rgb(var(--text-disabled-reverse) / <alpha-value>)',
					'background-base': 'rgb(var(--wrapper-background-base) / <alpha-value>)',
					'background-hover': 'rgb(var(--wrapper-background-hover) / <alpha-value>)',
					'background-base-light': 'rgb(var(--wrapper-background-base-light) / <alpha-value>)',
				},
			},
			backgroundColor: {
				base: 'rgb(var(--theme-base-background) / <alpha-value>)',
				subtle: 'rgb(var(--theme-subtle-background) / <alpha-value>)',
				lighter: 'rgb(var(--theme-lighter-background) / <alpha-value>)',
				'base-reverse': 'rgb(var(--theme-base-reverse-background) / <alpha-value>)',
				'subtle-reverse': 'rgb(var(--theme-subtle-reverse-background) / <alpha-value>)',
				'lighter-reverse': 'rgb(var(--theme-lighter-reverse-background) / <alpha-value>)',
			},
			textColor: {
				default: 'rgb(var(--text-base) / <alpha-value>)',
				subtle: 'rgb(var(--text-subtle) / <alpha-value>)',
				disabled: 'rgb(var(--text-disabled) / <alpha-value>)',
				'default-reverse': 'rgb(var(--text-base-reverse) / <alpha-value>)',
				'subtle-reverse': 'rgb(var(--text-subtle-reverse) / <alpha-value>)',
				'disabled-reverse': 'rgb(var(--text-disabled-reverse) / <alpha-value>)',
			},
			borderWidth: {
				3: '3px',
			},
			borderRadius: {
				lg: `var(--radius)`,
				md: `calc(var(--radius) - 2px)`,
				sm: 'calc(var(--radius) - 4px)',
				xs: 'calc(var(--radius) - 6px)',
			},
			fontFamily: {
				sans: ['var(--font-sans)', ...fontFamily.sans],
				albert: ['var(--font-albert)'],
				sfCompact: ['var(--font-sf)', ...fontFamily.sans],
				mono: ['var(--font-mono)', ...fontFamily.mono],
			},
			fontSize: {
				xs: ['var(--font-size-xs)', 'var(--font-size-xs-line-height)'],
				sm: ['var(--font-size-sm)', 'var(--font-size-sm-line-height)'],
			},
			keyframes: {
				'accordion-down': {
					from: { height: 0 },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: 0 },
				},
				animation: {
					'accordion-down': 'accordion-down 0.2s ease-out',
					'accordion-up': 'accordion-up 0.2s ease-out',
				},
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
};
