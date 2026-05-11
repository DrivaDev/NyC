import Link from 'next/link'
import { UtensilsCrossed, QrCode, Zap, Palette, Check, X, ChevronDown, ArrowRight, Star, Clock, Smartphone } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────

const STATS = [
  { value: '0',    unit: 'apps',   label: 'El cliente no descarga nada' },
  { value: '3',    unit: 'min',    label: 'Para tener el menú listo' },
  { value: '14',   unit: 'días',   label: 'De prueba gratuita sin tarjeta' },
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
  { feature: 'Sin costo de impresión',          menudig: true,  papel: false },
  { feature: 'Actualizaciones al instante',      menudig: true,  papel: false },
  { feature: 'Sin app para el cliente',          menudig: true,  papel: true  },
  { feature: 'QR incluido y descargable',        menudig: true,  papel: false },
  { feature: 'Fotos y descripciones de platos', menudig: true,  papel: false },
  { feature: 'Colores y marca propios',          menudig: true,  papel: false },
  { feature: '14 días de prueba gratuita',        menudig: true,  papel: false },
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

function CompareIcon({ val }: { val: boolean }) {
  if (val) return <Check size={16} className="mx-auto text-brand-titulares" strokeWidth={3} />
  return <X size={16} className="mx-auto text-gray-300" strokeWidth={3} />
}

// ─────────────────────────────────────────────────────────────────────────────
// Phone mockup (pure HTML/CSS — no images)
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_DISHES = [
  { name: 'Empanadas de carne (x6)', desc: 'Relleno criollo, horno de barro', price: '$4.800', bg: '#FDE68A' },
  { name: 'Provoleta a la parrilla',  desc: 'Con chimichurri casero',          price: '$6.200', bg: '#FCA5A5' },
  { name: 'Tabla de fiambres',        desc: 'Jamón, salame y quesos selectos', price: '$8.500', bg: '#C4B5A5' },
]

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[260px] sm:w-[280px] shrink-0 select-none">

      {/* Floating badge — top right */}
      <div className="absolute -right-10 top-14 z-20 bg-white rounded-2xl border border-brand-acento shadow-lg px-3 py-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
        <span className="text-[11px] font-semibold text-brand-titulares whitespace-nowrap">Menú actualizado</span>
      </div>

      {/* Floating badge — bottom left */}
      <div className="absolute -left-10 bottom-32 z-20 bg-white rounded-2xl border border-brand-acento shadow-lg px-3 py-2 flex items-center gap-2">
        <QrCode size={13} className="text-brand-principal shrink-0" />
        <span className="text-[11px] font-semibold text-brand-titulares whitespace-nowrap">Sin descargas</span>
      </div>

      {/* Side buttons */}
      <div className="absolute left-[-4px] top-[88px]  w-[4px] h-7 bg-gray-700 rounded-l-sm" />
      <div className="absolute left-[-4px] top-[124px] w-[4px] h-7 bg-gray-700 rounded-l-sm" />
      <div className="absolute right-[-4px] top-[108px] w-[4px] h-11 bg-gray-700 rounded-r-sm" />

      {/* Phone shell */}
      <div className="bg-gray-900 rounded-[3rem] p-[11px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.55)] ring-1 ring-white/5">

        {/* Screen */}
        <div className="bg-[#FFF7ED] rounded-[2.4rem] overflow-hidden" style={{ height: '572px' }}>

          {/* Status bar */}
          <div className="grid grid-cols-3 items-center px-5 pt-3 pb-1">
            <span className="text-[11px] font-bold text-brand-texto">9:41</span>
            <div className="w-[76px] h-[22px] bg-gray-900 rounded-full mx-auto" />
            <div className="flex justify-end items-center gap-[5px]">
              {/* Signal bars */}
              <div className="flex items-end gap-[2px] h-[10px]">
                {[4, 6, 8, 10].map((h, i) => (
                  <div key={i} className="w-[3px] rounded-sm bg-brand-texto" style={{ height: `${h}px` }} />
                ))}
              </div>
              {/* Battery */}
              <div className="flex items-center gap-[2px]">
                <div className="w-[18px] h-[10px] rounded-[3px] border border-brand-texto/70 relative">
                  <div className="absolute inset-[2px] bg-brand-texto rounded-[1px]" style={{ right: '4px' }} />
                </div>
                <div className="w-[2px] h-[5px] bg-brand-texto/60 rounded-r-sm" />
              </div>
            </div>
          </div>

          {/* Restaurant header */}
          <div className="px-4 pt-2 pb-3 flex items-center gap-3 border-b border-brand-acento/30">
            <div className="w-10 h-10 rounded-full bg-brand-acento border-2 border-brand-principal flex items-center justify-center shrink-0">
              <UtensilsCrossed size={15} className="text-brand-titulares" />
            </div>
            <div>
              <p className="text-[12px] font-bold text-brand-titulares leading-tight">La Parrilla del Centro</p>
              <p className="text-[10px] text-brand-texto/60 mt-0.5">menudig.com.ar/parrilla</p>
            </div>
          </div>

          {/* Category nav */}
          <div className="flex gap-2 px-4 py-2.5 border-b border-gray-200/70">
            <span className="bg-brand-principal text-white text-[10px] font-bold px-3 py-1 rounded-full">Entradas</span>
            <span className="text-brand-texto/50 text-[10px] px-3 py-1 rounded-full border border-gray-200">Parrilla</span>
            <span className="text-brand-texto/50 text-[10px] px-3 py-1 rounded-full border border-gray-200">Postres</span>
          </div>

          {/* Section title */}
          <div className="px-4 pt-3 pb-1">
            <p className="text-[10px] font-bold text-brand-titulares/60 uppercase tracking-widest">Entradas</p>
          </div>

          {/* Dish rows */}
          {MOCK_DISHES.map((d, i) => (
            <div key={d.name} className={`flex items-center gap-3 px-4 py-3 ${i < MOCK_DISHES.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <div
                className="w-12 h-12 rounded-xl shrink-0"
                style={{ backgroundColor: d.bg }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-brand-titulares leading-tight truncate">{d.name}</p>
                <p className="text-[10px] text-brand-texto/60 mt-0.5 truncate">{d.desc}</p>
                <p className="text-[12px] font-bold text-brand-titulares mt-1">{d.price}</p>
              </div>
            </div>
          ))}

          {/* Bottom safe area */}
          <div className="mt-auto px-4 pb-3 pt-4 border-t border-gray-100 flex justify-center">
            <div className="w-28 h-1 bg-gray-300 rounded-full" />
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
            <img src="/logo.svg" alt="MenuDig logo" width={24} height={24} className="shrink-0" />
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
                14 días gratis · Sin tarjeta · $20.000/mes después
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
                14 días gratis, sin tarjeta · Después $20.000/mes · Cancelás cuando querés
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
              <div className="grid grid-cols-3 bg-brand-acento/50">
                <div className="px-4 py-3 text-sm font-semibold text-brand-titulares">Característica</div>
                <div className="px-2 py-3 text-center text-sm font-bold text-brand-principal border-l border-brand-acento bg-brand-acento">MenuDig</div>
                <div className="px-2 py-3 text-center text-xs font-medium text-brand-texto/60 border-l border-brand-acento">Carta de papel</div>
              </div>

              {/* Rows */}
              {COMPARISON.map((row, i) => (
                <div
                  key={row.feature}
                  className={`grid grid-cols-3 border-t border-brand-acento/40 ${i % 2 === 0 ? 'bg-white' : 'bg-brand-fondo/40'}`}
                >
                  <div className="px-4 py-3 text-sm font-normal text-brand-texto flex items-center">{row.feature}</div>
                  <div className="px-2 py-3 flex items-center justify-center border-l border-brand-acento/40 bg-brand-acento/10">
                    <CompareIcon val={row.menudig} />
                  </div>
                  <div className="px-2 py-3 flex items-center justify-center border-l border-brand-acento/40">
                    <CompareIcon val={row.papel} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ──────────────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-titulares">Precio simple</h2>
            <p className="mt-3 text-base font-normal text-brand-texto max-w-sm mx-auto">
              Un solo plan. Todo incluido. Sin sorpresas.
            </p>
          </div>

          <div className="max-w-sm mx-auto bg-white rounded-2xl border-2 border-brand-principal p-8 text-center shadow-sm">
            <p className="text-xs font-bold text-brand-principal uppercase tracking-widest mb-3">Plan Mensual</p>
            <div className="mb-1">
              <span className="text-5xl font-bold text-brand-titulares">$20.000</span>
              <span className="text-base font-normal text-brand-texto">/mes</span>
            </div>
            <p className="text-sm font-normal text-brand-texto mb-7">
              Los primeros <strong className="font-semibold text-brand-titulares">14 días son gratis</strong>, sin tarjeta de crédito.
            </p>

            <ul className="flex flex-col gap-2.5 text-left mb-8">
              {[
                'Menú público sin límite de platos',
                'Código QR descargable en alta resolución',
                'Fotos de platos incluidas',
                'Colores y apariencia personalizados',
                'Actualizaciones ilimitadas en tiempo real',
                'Soporte incluido',
              ].map(item => (
                <li key={item} className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-brand-acento flex items-center justify-center shrink-0">
                    <Check size={11} className="text-brand-titulares" strokeWidth={3} />
                  </span>
                  <span className="text-sm font-normal text-brand-texto">{item}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/sign-up"
              className="block w-full bg-brand-principal text-white text-sm font-bold rounded-xl px-6 py-3.5 hover:bg-[#C2410C] transition-colors"
            >
              Empezar prueba gratuita
            </Link>
            <p className="text-xs font-light text-brand-texto/60 mt-3">
              Cancelás cuando querés · Cobro automático vía Mercado Pago
            </p>
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
              14 días gratis. Empezá hoy.
            </h2>
            <p className="text-base font-normal text-white/80 max-w-md mx-auto mb-8">
              Sin tarjeta. Tu menú digital listo en minutos. Después $20.000/mes, cancelás cuando querés.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 bg-white text-brand-principal text-sm font-bold rounded-xl px-8 py-4 hover:bg-brand-fondo focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-principal transition-colors shadow-sm"
            >
              Empezar prueba gratuita
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
            <img src="/logo.svg" alt="MenuDig logo" width={18} height={18} className="shrink-0" />
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
