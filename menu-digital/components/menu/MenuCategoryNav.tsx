'use client'

import { useState, useEffect } from 'react'

interface Category {
  _id: string
  name: string
}

interface Props {
  categories: Category[]
}

export function MenuCategoryNav({ categories }: Props) {
  const [activeId, setActiveId] = useState<string | null>(categories[0]?._id ?? null)

  useEffect(() => {
    if (categories.length === 0) return

    const observers: IntersectionObserver[] = []

    categories.forEach(cat => {
      const section = document.getElementById(`category-${cat._id}`)
      if (!section) return

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveId(cat._id)
        },
        {
          rootMargin: '-20% 0px -70% 0px',
          threshold: 0,
        }
      )
      observer.observe(section)
      observers.push(observer)
    })

    return () => observers.forEach(o => o.disconnect())
  }, [categories])

  function handleTabClick(categoryId: string) {
    // Optimistic active state update — do not wait for IntersectionObserver
    setActiveId(categoryId)
    const el = document.getElementById(`category-${categoryId}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav className="sticky top-0 z-10 bg-white border-b border-gray-100 overflow-x-auto">
      <div className="flex gap-0 px-4">
        {categories.map(cat => (
          <button
            key={cat._id}
            onClick={() => handleTabClick(cat._id)}
            className={`px-4 py-3 text-sm font-normal whitespace-nowrap border-b-2 transition-colors duration-150 ${
              activeId === cat._id
                ? 'border-brand-principal text-brand-principal'
                : 'border-transparent text-brand-texto hover:text-brand-titulares'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </nav>
  )
}
