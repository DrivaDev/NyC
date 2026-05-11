import { MetadataRoute } from 'next'
import { dbConnect } from '@/lib/dbConnect'
import { Restaurant } from '@/models/Restaurant'

export const revalidate = 3600

interface RestaurantSlug {
  slug: string
  updatedAt: Date
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await dbConnect()

  const restaurants = await Restaurant.find(
    { slugConfirmed: true },
    { slug: 1, updatedAt: 1 },
  ).lean<RestaurantSlug[]>()

  const menuEntries: MetadataRoute.Sitemap = restaurants.map(r => ({
    url: `https://menudig.com.ar/menu/${r.slug}`,
    lastModified: r.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    {
      url: 'https://menudig.com.ar',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    ...menuEntries,
  ]
}
