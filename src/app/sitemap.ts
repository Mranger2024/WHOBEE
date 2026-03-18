import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const BASE_URL = 'https://whobee.live';
    const now = new Date();

    const staticPages = [
        { url: BASE_URL, priority: 1.0, changefreq: 'weekly' as const },
        { url: `${BASE_URL}/lobby`, priority: 0.9, changefreq: 'weekly' as const },
        { url: `${BASE_URL}/blog`, priority: 0.9, changefreq: 'daily' as const },
        { url: `${BASE_URL}/world-tour`, priority: 0.7, changefreq: 'weekly' as const },
        { url: `${BASE_URL}/contact`, priority: 0.6, changefreq: 'monthly' as const },
        { url: `${BASE_URL}/privacy`, priority: 0.5, changefreq: 'monthly' as const },
        { url: `${BASE_URL}/terms`, priority: 0.5, changefreq: 'monthly' as const },
        { url: `${BASE_URL}/cookies`, priority: 0.4, changefreq: 'monthly' as const },
        { url: `${BASE_URL}/guidelines`, priority: 0.5, changefreq: 'monthly' as const },
    ];

    // Blog post slugs — keep in sync with /src/content/blog/
    const blogSlugs = [
        'how-to-meet-new-people-online',
        'anonymous-video-chat-apps-2025',
        'omegle-alternatives-2025',
        'what-is-webrtc-video-chat',
        'online-safety-tips-random-chat',
        'world-tour-random-chat-features',
    ];

    const blogPages = blogSlugs.map((slug) => ({
        url: `${BASE_URL}/blog/${slug}`,
        lastModified: now,
        priority: 0.8,
        changefreq: 'monthly' as const,
    }));

    return [
        ...staticPages.map((page) => ({
            url: page.url,
            lastModified: now,
            changeFrequency: page.changefreq,
            priority: page.priority,
        })),
        ...blogPages,
    ];
}
