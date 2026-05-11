'use client'

export function CancelSubscriptionForm() {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!confirm('¿Seguro que querés cancelar tu suscripción? Perderás el acceso al panel.')) {
      e.preventDefault()
    }
  }

  return (
    <form action="/api/subscription/cancel" method="POST" onSubmit={handleSubmit}>
      <button
        type="submit"
        className="w-full border border-gray-200 text-brand-texto text-sm font-medium rounded-lg px-6 py-3 min-h-[44px] hover:bg-gray-50 transition-colors"
      >
        Cancelar suscripción
      </button>
    </form>
  )
}
