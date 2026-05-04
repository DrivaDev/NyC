import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          principal: '#EA580C',
          titulares: '#9A3412',
          acento:    '#FED7AA',
          fondo:     '#FFF7ED',
          texto:     '#1C1917',
        },
      },
      fontFamily: {
        sans: ['var(--font-fira-sans)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
