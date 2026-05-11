'use client'

import { useState, useTransition } from 'react'
import { toggleAvailability } from '@/actions/dishes'

interface Props {
  dish: { _id: string; available: boolean }
  onToggleError?: (message: string) => void
}

export default function AvailabilityToggle({ dish, onToggleError }: Props) {
  const [optimisticAvailable, setOptimisticAvailable] = useState(dish.available)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    const next = !optimisticAvailable
    setOptimisticAvailable(next) // optimistic update

    const fd = new FormData()
    fd.append('dishId', dish._id)

    startTransition(async () => {
      const result = await toggleAvailability({ success: false }, fd)
      if (!result.success) {
        setOptimisticAvailable(!next) // revert on error
        onToggleError?.(result.error ?? 'Algo salió mal. Intentá de nuevo.')
      }
    })
  }

  return (
    <button
      role="switch"
      aria-checked={optimisticAvailable}
      onClick={handleToggle}
      disabled={isPending}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-principal focus:ring-offset-2 disabled:opacity-50 ${
        optimisticAvailable ? 'bg-brand-principal' : 'bg-gray-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          optimisticAvailable ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
