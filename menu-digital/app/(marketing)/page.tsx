import Link from 'next/link'
import { UtensilsCrossed, QrCode, Zap, Palette, Check, X, ChevronDown, ArrowRight, Star, Clock, Smartphone } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────

const STATS = [
  { value: '0',     unit: 'apps',    label: 'El cliente no descarga nada' },
  { value: '3',     unit: 'min',     label: 'Para tener el menú listo' },
  { value: '100%',  unit: '',        label: 'Personalizable: colores, fotos, precios' },
]

const FEATURES = [
  {
    icon: QrCode,
    title: 'Un QR, todo el menú',
    body: 'Generamos el código QR automáticamente. Tus clientes escanean y ven el menú desde cualquier celular, sin descargar ninguna app.',
    detail: 'Descargalo en PNG de alta resolución e imprimilo donde quieras.',
  },
  {
    icon: Palette,
    title: 'Tu identidad, tu marca',
    body: 'Elegí el color de acento, fondo, títulos y texto. El menú se ve como parte de tu local, no como un template genérico.',
    detail: 'Cambios que se reflejan en segundos en el menú público.',
  },
  {
    icon: Zap,
    title: 'Actualizaciones instantáneas',
    body: 'Subís el precio del asado, agregás el plato del día, desactivás lo que se terminó — y el menú se actualiza en el momento.',
    detail: 'Sin reimprimir, sin llamar a nadie, sin esperar.',
  },
  {
    icon: Smartphone,
    title: 'Diseñado para el celular',
    body: 'La experiencia está optimizada para móviles. Navegación por categorías, fotos de los platos, alérgenos — todo fácil de leer.',
    detail: 'Compatible con cualquier celular con cámara y navegador.',
  },
]

const COMPARISON = [
  { feature: 'Sin costo de impresión',          menudig: true,  papel: false, otras: null  },
  { feature: 'Actualizaciones al instante',      menudig: true,  papel: false, otras: true  },
  { feature: 'Sin app para el cliente',          menudig: true,  papel: true,  otras: false },
  { feature: 'QR incluido y descargable',        menudig: true,  papel: false, otras: null  },
  { feature: 'Fotos y descripciones de platos', menudig: true,  papel: false, otras: true  },
  { feature: 'Colores y marca propios',          menudig: true,  papel: false, otras: false },
  { feature: 'Gratis',                           menudig: true,  papel: null,  otras: false },
]

const FAQS = [
  {
    q: '¿Necesito saber programar o diseñar?',
    a: 'Para nada. El panel es tan simple como una hoja de cálculo: creás categorías, cargás los platos con foto y precio, y listo. El menú público se genera solo.',
  },
  {
    q: '¿Los clientes tienen que descargar algo?',
    a: 'No. Escanean el QR y el menú se abre directamente en el navegador del celular. Sin apps, sin registros, sin fricciones.',
  },
  {
    q: '¿Puedo tener más de un restaurante?',
    a: 'Cada cuenta gestiona un restaurante con su propio menú, URL y QR. Si tenés varios locales podés crear una cuenta por cada uno.',
  },
  {
    q: '¿Qué pasa si cambio de teléfono o pierdo acceso?',
    a: 'Tu cuenta es tuya y está en la nube. Podés acceder desde cualquier dispositivo con tu usuario y contraseña. Tus datos están seguros.',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function CompareIcon({ val }: { val: boolean | null }) {
  if (val === true)  return <Check  size={16} className="mx-auto text-brand-titulares" strokeWidth={3} />
  if (val === false) return <X      size={16} className="mx-auto text-gray-300"       strokeWidth={3} />
  return <span className="block text-center text-gray-300 text-sm leading-none">—</span>
}

// ─────────────────────────────────────────────────────────────────────────────
// Phone mockup (pure HTML/CSS — no images)
// ─────────────────────────────────────────────────────────────────────────────

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[240px] sm:w-[260px] shrink-0">

      {/* Floating badge — top right */}
      <div className="absolute -right-6 top-10 z-20 bg-white rounded-xl border border-brand-acento shadow-md px-3 py-2 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
        <span className="text-[11px] font-medium text-brand-titulares whitespace-nowrap">Menú actualizado</span>
      </div>

      {/* Floating badge — bottom left */}
      <div className="absolute -left-6 bottom-24 z-20 bg-white rounded-xl border border-brand-acento shadow-md px-3 py-2 flex items-center gap-1.5">
        <QrCode size={14} className="text-brand-principal shrink-0" />
        <span className="text-[11px] font-medium text-brand-titulares whitespace-nowrap">Sin app</span>
      </div>

      {/* Phone shell */}
      <div className="bg-gray-900 rounded-[2.5rem] p-[10px] shadow-2xl ring-1 ring-gray-700/50">
        {/* Screen */}
        <div className="bg-[#FFF7ED] rounded-[2rem] overflow-hidden h-[520px] flex flex-col">

          {/* Dynamic island */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-24 h-5 bg-gray-900 rounded-full" />
          </div>

          {/* Menu content */}
          <div className="flex-1 overflow-hidden flex flex-col">

            {/* Restaurant header */}
            <div className="px-4 pt-3 pb-2 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-brand-acento border border-brand-principal flex items-center justify-center shrink-0">
                <UtensilsCrossed size={14} className="text-brand-titulares" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-brand-titulares leading-tight">La Parrilla del Centro</p>
                <p className="text-[9px] text-brand-texto">Córdoba · menudig.com.ar/parrilla</p>
              </div>
            </div>

            {/* Category nav */}
            <div className="flex gap-1.5 px-3 pb-2 border-b border-brand-acento overflow-x-hidden shrink-0">
              <span className="bg-brand-principal text-white text-[9px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">Entradas</span>
              <span className="text-brand-texto text-[9px] px-2.5 py-1 rounded-full border border-gray-200 whitespace-nowrap">Parrilla</span>
              <span className="text-brand-texto text-[9px] px-2.5 py-1 rounded-full border border-gray-200 whitespace-nowrap">Postres</span>
            </div>

            {/* Category label */}
            <div className="px-3 py-2 border-b border-gray-100 shrink-0">
              <p className="text-[10px] font-bold text-brand-titulares">Entradas</p>
            </div>

            {/* Dish rows */}
            {[
              { name: 'Empanadas de carne (x6)', desc: 'Relleno criollo, horno de barro', price: '$4.800' },
              { name: 'Provoleta a la parrilla',  desc: 'Con chimichurri casero',           price: '$6.200' },
              { name: 'Tabla de fiambres',         desc: 'Jamón, salame y quesos',            price: '$8.500' },
            ].map(d => (
              <div key={d.name} className="flex items-start gap-2.5 px-3 py-2.5 border-b border-gray-100 last:border-0">
                <div className="w-10 h-10 rounded-md bg-brand-acento/50 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-brand-titulares leading-tight truncate">{d.name}</p>
                  <p className="text-[9px] text-brand-texto leading-tight mt-0.5 truncate">{d.desc}</p>
                  <p className="text-[10px] font-bold text-brand-titulares mt-1">{d.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-brand-fondo flex flex-col">

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-brand-fondo/95 backdrop-blur-sm border-b border-brand-acento">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <UtensilsCrossed size={20} className="text-brand-principal" />
            <span className="text-base font-bold text-brand-titulares tracking-tight">MenuDig</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-brand-texto">
            <a href="#funciones" className="hover:text-brand-titulares transition-colors">Funciones</a>
            <a href="#comparacion" className="hover:text-brand-titulares transition-colors">Comparación</a>
            <a href="#preguntas" className="hover:text-brand-titulares transition-colors">Preguntas</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-brand-texto hover:text-brand-titulares transition-colors"
            >
              Ingresar
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

        {/* ── HERO ────────────────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-16 sm:pt-20 sm:pb-24">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

            {/* Left: copy */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-brand-acento text-brand-titulares text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <Star size={12} fill="currentColor" />
                Sin comisiones · Sin contratos · 100% gratis
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-brand-titulares leading-[1.1] tracking-tight">
                El menú digital<br />
                <span className="text-brand-principal">que tus clientes</span><br />
                quieren ver
              </h1>

              <p className="mt-6 text-base sm:text-lg font-normal text-brand-texto max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Creá tu menú en minutos, personalizá los colores y compartilo con un QR.
                Tus clientes lo ven en su celular, sin descargar nada.
              </p>

              {/* Stats inline */}
              <div className="mt-8 flex items-center justify-center lg:justify-start gap-6 sm:gap-8">
                {STATS.map(s => (
                  <div key={s.label} className="text-center lg:text-left">
                    <p className="text-2xl sm:text-3xl font-bold text-brand-principal leading-none">
                      {s.value}<span className="text-lg">{s.unit}</span>
                    </p>
                    <p className="text-[11px] font-light text-brand-texto mt-1 leading-tight max-w-[80px]">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <Link
                  href="/sign-up"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-principal text-white text-sm font-semibold rounded-xl px-7 py-3.5 min-h-[48px] hover:bg-[#C2410C] focus:outline-none focus:ring-2 focus:ring-brand-principal focus:ring-offset-2 transition-colors shadow-sm"
                >
                  Crear mi menú gratis
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/sign-in"
                  className="w-full sm:w-auto flex items-center justify-center border border-brand-acento text-brand-titulares text-sm font-medium rounded-xl px-7 py-3.5 min-h-[48px] hover:bg-brand-acento/40 focus:outline-none focus:ring-2 focus:ring-brand-principal focus:ring-offset-2 transition-colors"
                >
                  Ya tengo cuenta
                </Link>
              </div>

              <p className="mt-4 text-xs font-light text-brand-texto/70 text-center lg:text-left">
                Sin tarjeta de crédito · Listo en 3 minutos
              </p>
            </div>

            {/* Right: phone mockup */}
            <div className="w-full lg:w-auto flex justify-center lg:justify-end shrink-0">
              <PhoneMockup />
            </div>
          </div>
        </section>

        {/* ── SOCIAL PROOF BAR ─────────────────────────────────────────────── */}
        <div className="bg-brand-acento border-y border-brand-acento/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-8 text-center">
            <p className="text-sm font-semibold text-brand-titulares flex items-center gap-2">
              <Clock size={14} />
              Tu menú público listo en menos de 3 minutos
            </p>
            <span className="hidden sm:block text-brand-titulares/30">·</span>
            <p className="text-sm font-semibold text-brand-titulares flex items-center gap-2">
              <Smartphone size={14} />
              Compatible con todos los celulares
            </p>
            <span className="hidden sm:block text-brand-titulares/30">·</span>
            <p className="text-sm font-semibold text-brand-titulares flex items-center gap-2">
              <QrCode size={14} />
              QR descargable incluido
            </p>
          </div>
        </div>

        {/* ── FEATURES ─────────────────────────────────────────────────────── */}
        <section id="funciones" className="bg-white border-b border-brand-acento/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-brand-titulares">Todo lo que necesitás</h2>
              <p className="mt-3 text-base font-normal text-brand-texto max-w-md mx-auto">
                Simple de configurar, poderoso en resultados.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {FEATURES.map(({ icon: Icon, title, body, detail }) => (
                <div
                  key={title}
                  className="group flex flex-col gap-4 bg-brand-fondo rounded-2xl border border-brand-acento p-7 hover:border-brand-principal transition-colors"
                >
                  <div className="w-11 h-11 rounded-xl bg-brand-acento flex items-center justify-center shrink-0">
                    <Icon size={22} className="text-brand-titulares" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-brand-titulares mb-2">{title}</h3>
                    <p className="text-sm font-normal text-brand-texto leading-relaxed">{body}</p>
                    <p className="text-xs font-light text-brand-texto/70 mt-3 flex items-center gap-1">
                      <Check size={11} className="text-brand-principal" strokeWidth={3} />
                      {detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-titulares">De cero a menú en 3 pasos</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6 relative">
            {/* Connector line (desktop only) */}
            <div className="hidden sm:block absolute top-7 left-[calc(16.66%+16px)] right-[calc(16.66%+16px)] h-px bg-brand-acento" />

            {[
              { n: 1, title: 'Creá tu cuenta', body: 'Registrate con tu correo. Sin tarjeta, sin compromiso.', icon: Star },
              { n: 2, title: 'Cargá tu menú', body: 'Creá categorías, subí fotos y poné los precios desde el panel.', icon: Zap },
              { n: 3, title: 'Compartí el QR', body: 'Descargá el código QR e imprimilo en la mesa o la entrada.', icon: QrCode },
            ].map(({ n, title, body, icon: Icon }) => (
              <div key={n} className="flex flex-col items-center text-center gap-4">
                <div className="relative z-10 w-14 h-14 rounded-full bg-brand-principal flex items-center justify-center shadow-md shrink-0">
                  <span className="text-xl font-bold text-white">0{n}</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-brand-titulares mb-1">{title}</h3>
                  <p className="text-sm font-normal text-brand-texto leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 bg-brand-principal text-white text-sm font-semibold rounded-xl px-7 py-3.5 hover:bg-[#C2410C] transition-colors"
            >
              Empezar ahora <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* ── COMPARISON ───────────────────────────────────────────────────── */}
        <section id="comparacion" className="bg-white border-y border-brand-acento/40">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-brand-titulares">¿Por qué MenuDig?</h2>
              <p className="mt-3 text-base font-normal text-brand-texto max-w-sm mx-auto">
                Comparado con las otras opciones del mercado.
              </p>
            </div>

            <div className="rounded-2xl border border-brand-acento overflow-hidden shadow-sm">
              {/* Table header */}
              <div className="grid grid-cols-4 bg-brand-acento/50">
                <div className="px-4 py-3 text-sm font-semibold text-brand-titulares col-span-1">Característica</div>
                <div className="px-2 py-3 text-center text-sm font-bold text-brand-principal border-l border-brand-acento bg-brand-acento">MenuDig</div>
                <div className="px-2 py-3 text-center text-xs font-medium text-brand-texto/60 border-l border-brand-acento">Carta de papel</div>
                <div className="px-2 py-3 text-center text-xs font-medium text-brand-texto/60 border-l border-brand-acento">Otras apps</div>
              </div>

              {/* Rows */}
              {COMPARISON.map((row, i) => (
                <div
                  key={row.feature}
                  className={`grid grid-cols-4 border-t border-brand-acento/40 ${i % 2 === 0 ? 'bg-white' : 'bg-brand-fondo/40'}`}
                >
                  <div className="px-4 py-3 text-sm font-normal text-brand-texto flex items-center">{row.feature}</div>
                  <div className="px-2 py-3 flex items-center justify-center border-l border-brand-acento/40 bg-brand-acento/10">
                    <CompareIcon val={row.menudig} />
                  </div>
                  <div className="px-2 py-3 flex items-center justify-center border-l border-brand-acento/40">
                    <CompareIcon val={row.papel} />
                  </div>
                  <div className="px-2 py-3 flex items-center justify-center border-l border-brand-acento/40">
                    <CompareIcon val={row.otras} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIAL ──────────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="bg-brand-acento/40 rounded-3xl border border-brand-acento p-8 sm:p-12 max-w-2xl mx-auto text-center">
            <div className="flex justify-center gap-0.5 mb-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={18} className="text-brand-principal" fill="#EA580C" />
              ))}
            </div>
            <blockquote className="text-lg sm:text-xl font-normal text-brand-titulares leading-relaxed italic mb-6">
              "Antes imprimíamos la carta cada vez que cambiaban los precios. Con MenuDig actualizamos todo en el momento desde el celular. Nuestros clientes lo aman."
            </blockquote>
            <div>
              <p className="text-sm font-bold text-brand-titulares">María Luz González</p>
              <p className="text-xs font-light text-brand-texto mt-0.5">El Rincón de Siempre · Mendoza</p>
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────────── */}
        <section id="preguntas" className="bg-white border-t border-brand-acento/40">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-brand-titulares">Preguntas frecuentes</h2>
            </div>

            <div className="flex flex-col divide-y divide-brand-acento/60">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="group py-5">
                  <summary className="flex justify-between items-center cursor-pointer list-none [&::-webkit-details-marker]:hidden gap-4">
                    <span className="text-base font-semibold text-brand-titulares">{q}</span>
                    <ChevronDown
                      size={18}
                      className="shrink-0 text-brand-texto transition-transform duration-200 group-open:rotate-180"
                    />
                  </summary>
                  <p className="mt-3 text-sm font-normal text-brand-texto leading-relaxed pr-8">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
        <section className="bg-brand-principal">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">
              Empezá hoy. Es gratis.
            </h2>
            <p className="text-base font-normal text-white/80 max-w-md mx-auto mb-8">
              Sin tarjeta de crédito, sin contratos. Tu menú digital listo en menos de 3 minutos.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 bg-white text-brand-principal text-sm font-bold rounded-xl px-8 py-4 hover:bg-brand-fondo focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-principal transition-colors shadow-sm"
            >
              Crear mi menú gratis
              <ArrowRight size={16} />
            </Link>
            <p className="mt-4 text-xs font-light text-white/60">
              ¿Ya tenés cuenta? <Link href="/sign-in" className="underline hover:text-white">Iniciá sesión</Link>
            </p>
          </div>
        </section>

      </main>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="bg-brand-fondo border-t border-brand-acento/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <UtensilsCrossed size={16} className="text-brand-principal" />
            <span className="text-sm font-bold text-brand-titulares">MenuDig</span>
          </div>
          <div className="flex items-center gap-5 text-xs font-normal text-brand-texto">
            <a href="#funciones"    className="hover:text-brand-titulares transition-colors">Funciones</a>
            <a href="#comparacion"  className="hover:text-brand-titulares transition-colors">Comparación</a>
            <a href="#preguntas"    className="hover:text-brand-titulares transition-colors">Preguntas</a>
            <Link href="/sign-up"   className="hover:text-brand-titulares transition-colors">Registro</Link>
          </div>
          <p className="text-xs font-light text-brand-texto">
            Desarrollado por <strong className="font-bold">Driva Dev</strong>
          </p>
        </div>
      </footer>

    </div>
  )
}
