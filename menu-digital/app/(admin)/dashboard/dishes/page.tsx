import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'
import { Category } from '@/models/Category'
import { Dish } from '@/models/Dish'
import DishesClient from '@/components/dashboard/DishesClient'

export default async function DishesPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await dbConnect()
  const restaurant = await Restaurant.findOne({ clerkId: userId }).lean<{
    _id: string
    slug: string
  }>()
  if (!restaurant) redirect('/dashboard')

  const [categories, dishes] = await Promise.all([
    Category.find({ restaurantId: restaurant._id }).sort({ order: 1 }).lean(),
    Dish.find({ restaurantId: restaurant._id }).sort({ createdAt: -1 }).lean(),
  ])

  return (
    <DishesClient
      dishes={JSON.parse(JSON.stringify(dishes))}
      categories={JSON.parse(JSON.stringify(categories))}
    />
  )
}
