/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
			extend: {
				colors: {
					border: 'hsl(var(--border))',
					input: 'hsl(var(--input))',
					ring: 'hsl(var(--ring))',
					background: 'hsl(var(--background))',
					foreground: 'hsl(var(--foreground))',
					primary: {
						400: '#F87171',
						500: '#EF4444',
						600: '#DC2626',
						700: '#B91C1C',
						DEFAULT: '#DC2626',
						foreground: '#ffffff',
					},
					accent: {
						400: '#FBBF24',
						500: '#EAB308',
						DEFAULT: '#EAB308',
						foreground: '#000000',
					},
					neutral: {
						50: '#FAFAFA',
						100: '#F5F5F5',
						200: '#E5E5E5',
						300: '#D4D4D4',
						400: '#A3A3A3',
						500: '#737373',
						600: '#6B7280',
						700: '#404040',
						800: '#1F2937',
						900: '#000000',
						950: '#0A0A0A',
					},
					success: {
						500: '#10B981',
					},
					warning: {
						500: '#F59E0B',
					},
					error: {
						500: '#EF4444',
					},
					info: {
						500: '#3B82F6',
					},
					secondary: {
						DEFAULT: '#4A90E2',
						foreground: 'hsl(var(--secondary-foreground))',
					},
					destructive: {
						DEFAULT: 'hsl(var(--destructive))',
						foreground: 'hsl(var(--destructive-foreground))',
					},
					muted: {
						DEFAULT: 'hsl(var(--muted))',
						foreground: 'hsl(var(--muted-foreground))',
					},
					popover: {
						DEFAULT: 'hsl(var(--popover))',
						foreground: 'hsl(var(--popover-foreground))',
					},
					card: {
						DEFAULT: 'hsl(var(--card))',
						foreground: 'hsl(var(--card-foreground))',
					},
				},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
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
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
}