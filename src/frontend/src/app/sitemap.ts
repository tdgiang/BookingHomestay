import type { MetadataRoute } from 'next';
import axios from 'axios';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000') + '/api/v1';

async function getRoomIds(): Promise<string[]> {
  try {
    const res = await axios.get(`${API_URL}/rooms`, {
      params: { limit: 100, sortBy: 'createdAt', sortOrder: 'desc', isActive: 'true' },
    });
    const items: { id: string }[] = res.data?.data?.items ?? [];
    return items.map((r) => r.id);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const roomIds = await getRoomIds();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/rooms`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE_URL}/booking/lookup`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ];

  const roomRoutes: MetadataRoute.Sitemap = roomIds.map((id) => ({
    url: `${SITE_URL}/rooms/${id}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  return [...staticRoutes, ...roomRoutes];
}
