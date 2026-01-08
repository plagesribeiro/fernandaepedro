import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {
			colors: {
				'wedding-gold': '#D4AF37',
				'wedding-gold-light': '#F4E4C1',
				'wedding-ivory': '#FFFFF0',
				'wedding-cream': '#F5F5DC',
				'wedding-blush': '#FFE4E1',
				'wedding-blush-deep': '#F4C2C2',
				'wedding-rose-gold': '#B76E79'
			},

			fontFamily: {
				heading: ['Playfair Display', 'serif'],
				script: ['Great Vibes', 'cursive'],
				body: ['Lato', 'sans-serif']
			},

			animation: {
				'fade-in': 'fadeIn 1.2s ease-in-out',
				'fade-in-up': 'fadeInUp 1s ease-out',
				'fade-in-down': 'fadeInDown 1s ease-out',
				float: 'float 6s ease-in-out infinite',
				shimmer: 'shimmer 3s ease-in-out infinite'
			},

			keyframes: {
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				fadeInUp: {
					'0%': { opacity: '0', transform: 'translateY(30px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				fadeInDown: {
					'0%': { opacity: '0', transform: 'translateY(-30px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				float: {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-20px)' }
				},
				shimmer: {
					'0%, 100%': { opacity: '0.5' },
					'50%': { opacity: '1' }
				}
			}
		}
	},

	plugins: [daisyui],

	daisyui: {
		themes: [
			{
				wedding: {
					primary: '#D4AF37',
					secondary: '#B76E79',
					accent: '#F4C2C2',
					neutral: '#FFFFF0',
					'base-100': '#FFFFF0',
					'base-200': '#F5F5DC',
					'base-300': '#F4E4C1'
				}
			}
		]
	}
};
