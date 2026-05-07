export default function MarketingPage() {
  return (
    <main className="min-h-screen bg-brand-fondo flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
        <h1 className="text-2xl font-bold text-brand-titulares">Menú Digital</h1>
        <p className="text-sm font-normal text-brand-texto">
          El menú digital de tu restaurante, accesible desde cualquier celular.
        </p>
        <div className="flex flex-col gap-3 w-full">
          <a
            href="/sign-in"
            className="w-full flex items-center justify-center bg-brand-principal text-white text-sm font-medium rounded-lg px-4 py-3 min-h-[44px] hover:bg-[#C2410C] focus:outline-none focus:ring-2 focus:ring-brand-principal focus:ring-offset-2 transition-colors duration-150"
          >
            Iniciar sesión
          </a>
          <a
            href="/sign-up"
            className="w-full flex items-center justify-center border border-brand-principal text-brand-principal text-sm font-medium rounded-lg px-4 py-3 min-h-[44px] hover:bg-brand-fondo focus:outline-none focus:ring-2 focus:ring-brand-principal focus:ring-offset-2 transition-colors duration-150"
          >
            Crear cuenta
          </a>
        </div>
      </div>

      <footer className="absolute bottom-6 text-center">
        <p className="text-xs font-light text-brand-texto">
          Desarrollado por <strong className="font-bold">Driva Dev</strong>
        </p>
      </footer>
    </main>
  )
}
