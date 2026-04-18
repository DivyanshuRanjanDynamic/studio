import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/login', '/dashboard', '/admin', '/api/'],
    },
    sitemap: 'https://www.mechhub.in/sitemap.xml',
  };
}
