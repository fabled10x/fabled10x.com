import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/products/account',
          '/products/account/',
          '/api/products/downloads',
          '/login',
          '/login/',
          '/api/auth',
        ],
      },
    ],
    sitemap: 'https://fabled10x.com/sitemap.xml',
  };
}
