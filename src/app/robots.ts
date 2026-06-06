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
          '/products/account/cohorts',
          '/api/products/downloads',
          '/login',
          '/login/',
          '/api/auth',
          '/cohorts/*/apply',
          '/cohorts/*/checkout',
          '/admin',
        ],
      },
    ],
    sitemap: 'https://fabled10x.com/sitemap.xml',
  };
}
