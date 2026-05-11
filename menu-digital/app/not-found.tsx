import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-fondo flex flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-brand-titulares mb-4">404</p>
      <h1 className="text-2xl font-bold text-brand-titulares mb-2">
        Menú no encontrado
      </h1>
      <p className="text-sm font-normal text-brand-texto mb-8 max-w-xs">
        El menú que buscás no existe o fue dado de baja. Pedile el link actualizado al restaurante.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center bg-brand-principal text-white text-sm font-medium rounded-lg px-6 py-3 min-h-[44px] hover:bg-[#C2410C] focus:outline-none focus:ring-2 focus:ring-brand-principal focus:ring-offset-2 transition-colors duration-150"
      >
        Volver al inicio
      </Link>
      <footer className="absolute bottom-6 text-xs font-light text-brand-texto opacity-60">
        Desarrollado por Driva Dev
      </footer>
    </div>
  )
}
