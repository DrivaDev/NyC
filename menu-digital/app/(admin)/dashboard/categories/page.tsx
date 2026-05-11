import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'
import { Category } from '@/models/Category'
import CategoriesClient from '@/components/dashboard/CategoriesClient'

export default async function CategoriesPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  await dbConnect()
  const restaurant = await Restaurant.findOne({ clerkId: userId }).lean<{
    _id: string
    slug: string
  }>()
  if (!restaurant) redirect('/dashboard')

  const categories = await Category
    .find({ restaurantId: restaurant._id })
    .sort({ order: 1 })
    .lean()

  return <CategoriesClient categories={JSON.parse(JSON.stringify(categories))} />
}
