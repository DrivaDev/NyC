import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/menu/'],
        disallow: ['/dashboard/', '/admin/', '/sign-in/', '/sign-up/', '/api/'],
      },
    ],
    sitemap: 'https://menudig.com.ar/sitemap.xml',
  }
}
