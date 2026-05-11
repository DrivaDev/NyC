import { notFound } from 'next/navigation'
import Image from 'next/image'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant as RestaurantModel } from '@/models/Restaurant'
import { Category as CategoryModel } from '@/models/Category'
import { Dish as DishModel } from '@/models/Dish'
import { MenuCategoryNav } from '@/components/menu/MenuCategoryNav'
import { DishRow } from '@/components/menu/DishRow'

// On-demand ISR — no revalidate interval (per D-14)
// Revalidation happens via revalidatePath('/menu/' + slug) called by all mutating server actions.

// Return empty array — no paths pre-built at build time.
// dynamicParams = true (default) allows on-demand generation for any slug.
export async function generateStaticParams() {
  return []
}

interface RestaurantData {
  _id: string
  name: string
  slug: string
  logoUrl: string
  description: string
  menuColor: string
}

interface CategoryData {
  _id: string
  name: string
  order: number
}

interface DishData {
  _id: string
  categoryId: string
  name: string
  description: string
  price: number
  imageUrl: string
  allergens: string[]
}

export default async function MenuPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  // CRITICAL: await params before accessing slug (Next.js 15+ requirement)
  const { slug } = await params

  await dbConnect()

  // Public route — do NOT call auth() here. Join via slug → restaurant._id.
  const restaurant = await RestaurantModel.findOne({ slug }).lean<RestaurantData>()
  if (!restaurant) notFound()

  const [categories, dishes] = await Promise.all([
    CategoryModel.find({ restaurantId: restaurant._id }).sort({ order: 1 }).lean<CategoryData[]>(),
    DishModel.find({ restaurantId: restaurant._id, available: true }).lean<DishData[]>(),
  ])

  // Group dishes by categoryId — server-side, no client round-trip (per D-16)
  const dishesByCategory: Record<string, DishData[]> = {}
  for (const dish of dishes) {
    const key = String(dish.categoryId)
    if (!dishesByCategory[key]) dishesByCategory[key] = []
    dishesByCategory[key].push(dish)
  }

  // Serialize to plain JSON — removes Mongoose ObjectId instances (per project pattern)
  const serializedCategories: CategoryData[] = JSON.parse(JSON.stringify(categories))
  const serializedDishesByCategory: Record<string, DishData[]> = JSON.parse(JSON.stringify(dishesByCategory))
  const serializedRestaurant: RestaurantData = JSON.parse(JSON.stringify(restaurant))

  // Filter out categories with no available dishes
  const populatedCategories = serializedCategories.filter(
    cat => (serializedDishesByCategory[cat._id] ?? []).length > 0
  )

  return (
    <div className="min-h-screen bg-brand-fondo">
      {/* Max-width container — responsive centering */}
      <div className="sm:max-w-lg md:max-w-2xl sm:mx-auto">

        {/* Restaurant header */}
        <header className="bg-brand-fondo px-4 py-8 sm:px-8 sm:py-10">
          {serializedRestaurant.logoUrl && (
            <Image
              src={serializedRestaurant.logoUrl}
              alt={`Logo de ${serializedRestaurant.name}`}
              width={80}
              height={80}
              className="w-20 h-20 rounded-full object-cover border border-brand-acento"
            />
          )}
          <h1 className="text-2xl font-bold text-brand-titulares leading-tight mt-4">
            {serializedRestaurant.name}
          </h1>
          {serializedRestaurant.description && (
            <p className="text-sm font-normal text-brand-texto leading-normal mt-2 max-w-prose">
              {serializedRestaurant.description}
            </p>
          )}
        </header>

        {/* Sticky category tab bar — client island (only 'use client' component on page) */}
        {populatedCategories.length > 0 && (
          <MenuCategoryNav
            categories={populatedCategories.map(c => ({ _id: c._id, name: c.name }))}
            menuColor={serializedRestaurant.menuColor ?? '#EA580C'}
          />
        )}

        {/* Category sections */}
        <main>
          {populatedCategories.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-base font-normal text-brand-texto">Sin categorías disponibles</p>
              <p className="text-sm font-normal text-brand-texto mt-2">
                Este restaurante aún no ha publicado su menú.
              </p>
            </div>
          ) : (
            populatedCategories.map(cat => {
              const catDishes = serializedDishesByCategory[cat._id] ?? []
              return (
                <section
                  key={cat._id}
                  id={`category-${cat._id}`}
                  className="scroll-mt-12"
                >
                  <div className="px-4 py-3 bg-brand-fondo border-b border-gray-100">
                    <h2 className="text-lg font-bold text-brand-titulares leading-tight">
                      {cat.name}
                    </h2>
                  </div>
                  {catDishes.map(dish => (
                    <DishRow key={dish._id} dish={dish} />
                  ))}
                </section>
              )
            })
          )}
        </main>

        {/* Footer */}
        <footer className="mt-8 pb-16 px-4 text-center border-t border-gray-100">
          <p className="text-sm font-normal text-brand-texto mt-6">
            Desarrollado por Driva Dev
          </p>
        </footer>

      </div>
    </div>
  )
}
