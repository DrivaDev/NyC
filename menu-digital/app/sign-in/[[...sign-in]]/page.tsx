import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-brand-fondo flex flex-col items-center justify-center px-4 py-12">
      <div className="bg-white rounded-lg shadow-sm w-full max-w-md px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-brand-titulares mb-1">
            Iniciar sesión
          </h1>
          <p className="text-sm font-normal text-brand-texto">
            Accedé al panel de tu restaurante
          </p>
        </div>

        <SignIn
          appearance={{
            variables: {
              colorPrimary: '#EA580C',
              colorBackground: '#FFFFFF',
              colorText: '#1C1917',
              colorTextSecondary: '#1C1917',
              colorInputBackground: '#FFFFFF',
              colorInputText: '#1C1917',
              borderRadius: '6px',
              fontFamily: 'var(--font-fira-sans), sans-serif',
              fontSize: '14px',
            },
            elements: {
              card: 'shadow-none p-0',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
              footerAction: 'hidden',
              formButtonPrimary:
                'bg-brand-principal hover:bg-[#C2410C] text-white font-medium rounded-lg min-h-[44px] transition-colors duration-150',
              formFieldInput:
                'border border-gray-200 rounded-md focus:border-brand-principal focus:ring-1 focus:ring-brand-principal outline-none',
              formFieldLabel: 'text-sm font-medium text-brand-texto',
            },
          }}
        />

        <p className="mt-6 text-center text-sm text-brand-texto">
          ¿No tenés cuenta?{' '}
          <a href="/sign-up" className="text-brand-principal hover:underline font-medium">
            Registrate
          </a>
        </p>

        <footer className="mt-8 pt-6 border-t border-brand-acento text-center">
          <p className="text-xs font-light text-brand-texto">Desarrollado por Driva Dev</p>
        </footer>
      </div>
    </main>
  )
}
