import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/', '/random/', '/voice-chat/', '/text-chat/', '/mobileUI/'],
            },
        ],
        sitemap: 'https://whobee.live/sitemap.xml',
        host: 'https://whobee.live',
    };
}
