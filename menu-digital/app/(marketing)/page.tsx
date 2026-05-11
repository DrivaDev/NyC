import Link from 'next/link'
import { QrCode, Palette, Zap, ArrowRight, UtensilsCrossed, Check } from 'lucide-react'

// ── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: QrCode,
    title: 'Menú por QR',
    body: 'Tus clientes escanean el código y ven el menú al instante, sin descargar ninguna app.',
  },
  {
    icon: Palette,
    title: 'Colores a tu medida',
    body: 'Personalizá el acento, fondo, títulos y texto del menú para que combine con tu local.',
  },
  {
    icon: Zap,
    title: 'Cambios en tiempo real',
    body: 'Actualizá precios, agregá platos o desactivá items sin esperar. Los cambios se reflejan de inmediato.',
  },
]

const STEPS = [
  { n: '01', title: 'Creá tu cuenta', body: 'Registrate en segundos con tu correo electrónico.' },
  { n: '02', title: 'Cargá tu menú', body: 'Creá categorías, subí fotos y definí precios desde el panel de administración.' },
  { n: '03', title: 'Compartí el QR', body: 'Descargá el código QR e imprimilo en tu mesa, mostrador o puerta.' },
]

const PLAN_ITEMS = [
  'Menú público sin límite de platos',
  'QR descargable en alta resolución',
  'Fotos de platos incluidas',
  'Colores y apariencia personalizados',
  'Actualizaciones ilimitadas',
  'Sin app para el cliente',
]

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-brand-fondo flex flex-col">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-20 bg-brand-fondo/95 backdrop-blur-sm border-b border-brand-acento">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <UtensilsCrossed size={20} className="text-brand-principal" />
            <span className="text-base font-bold text-brand-titulares tracking-tight">MenuDig</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-brand-texto hover:text-brand-titulares transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/sign-up"
              className="bg-brand-principal text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-[#C2410C] transition-colors"
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-acento/60 text-brand-titulares text-xs font-medium px-3 py-1 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-principal inline-block" />
            Sin comisiones · Sin contratos
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-brand-titulares leading-tight max-w-2xl mx-auto">
            El menú digital de tu restaurante
          </h1>

          <p className="mt-5 text-base sm:text-lg font-normal text-brand-texto max-w-xl mx-auto leading-relaxed">
            Creá tu menú en minutos, personalizá los colores y compartilo con un código QR.
            Tus clientes lo ven desde cualquier celular, sin apps.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-principal text-white text-sm font-medium rounded-lg px-6 py-3 min-h-[44px] hover:bg-[#C2410C] focus:outline-none focus:ring-2 focus:ring-brand-principal focus:ring-offset-2 transition-colors"
            >
              Crear cuenta gratis
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/sign-in"
              className="w-full sm:w-auto flex items-center justify-center border border-brand-principal text-brand-principal text-sm font-medium rounded-lg px-6 py-3 min-h-[44px] hover:bg-brand-acento/20 focus:outline-none focus:ring-2 focus:ring-brand-principal focus:ring-offset-2 transition-colors"
            >
              Iniciar sesión
            </Link>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="bg-white border-y border-brand-acento">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
            <h2 className="text-2xl font-bold text-brand-titulares text-center mb-12">
              Todo lo que necesitás
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="flex flex-col gap-4 bg-brand-fondo rounded-xl border border-brand-acento p-6"
                >
                  <div className="w-10 h-10 rounded-lg bg-brand-acento flex items-center justify-center shrink-0">
                    <Icon size={20} className="text-brand-titulares" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-brand-titulares mb-1">{title}</h3>
                    <p className="text-sm font-normal text-brand-texto leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h2 className="text-2xl font-bold text-brand-titulares text-center mb-12">
            ¿Cómo funciona?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {STEPS.map(({ n, title, body }) => (
              <div key={n} className="flex flex-col gap-3">
                <span className="text-4xl font-bold text-brand-acento leading-none">{n}</span>
                <h3 className="text-base font-bold text-brand-titulares">{title}</h3>
                <p className="text-sm font-normal text-brand-texto leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Plan / Includes ── */}
        <section className="bg-white border-y border-brand-acento">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-brand-titulares">Incluido en tu cuenta</h2>
                <p className="text-sm font-normal text-brand-texto mt-2">
                  Sin planes, sin límites, sin sorpresas.
                </p>
              </div>
              <ul className="flex flex-col gap-3">
                {PLAN_ITEMS.map(item => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-brand-acento flex items-center justify-center shrink-0">
                      <Check size={12} className="text-brand-titulares" strokeWidth={3} />
                    </span>
                    <span className="text-sm font-normal text-brand-texto">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <h2 className="text-3xl font-bold text-brand-titulares mb-4">
            Empezá hoy, gratis
          </h2>
          <p className="text-base font-normal text-brand-texto max-w-md mx-auto mb-8">
            Tu menú digital listo en minutos. Sin tarjeta de crédito.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 bg-brand-principal text-white text-sm font-medium rounded-lg px-8 py-3 min-h-[44px] hover:bg-[#C2410C] focus:outline-none focus:ring-2 focus:ring-brand-principal focus:ring-offset-2 transition-colors"
          >
            Crear cuenta gratis
            <ArrowRight size={16} />
          </Link>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-brand-acento py-6 px-4 text-center">
        <p className="text-sm font-normal text-brand-texto">
          Desarrollado por <strong className="font-bold">Driva Dev</strong>
        </p>
      </footer>

    </div>
  )
}
