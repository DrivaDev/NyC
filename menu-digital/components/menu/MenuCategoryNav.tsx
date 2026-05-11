'use client'

import { useState, useEffect } from 'react'

interface Category {
  _id: string
  name: string
}

interface Props {
  categories: Category[]
  menuColor?: string
}

export function MenuCategoryNav({ categories, menuColor = '#EA580C' }: Props) {
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
    setActiveId(categoryId)
    const el = document.getElementById(`category-${categoryId}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav className="sticky top-0 z-10 bg-brand-fondo/95 backdrop-blur-sm border-b border-brand-acento overflow-x-auto">
      <div className="flex gap-2 px-4 py-3">
        {categories.map(cat => {
          const isActive = activeId === cat._id
          return (
            <button
              key={cat._id}
              onClick={() => handleTabClick(cat._id)}
              className="px-4 py-1.5 text-sm font-medium whitespace-nowrap rounded-full transition-all duration-150"
              style={
                isActive
                  ? { backgroundColor: menuColor, color: '#fff' }
                  : { color: '#1C1917' }
              }
            >
              {cat.name}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
