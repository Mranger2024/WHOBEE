import { getPostBySlug, getPostSlugs } from '@/lib/blog';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { Calendar, Clock, ArrowLeft, Tag } from 'lucide-react';
import Script from 'next/script';

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const post = getPostBySlug(slug);
    if (!post) return { title: 'Post Not Found' };

    return {
        title: post.title,
        description: post.description,
        authors: [{ name: post.author }],
        alternates: { canonical: `https://whobee.live/blog/${slug}` },
        openGraph: {
            title: `${post.title} | WHOBEE Blog`,
            description: post.description,
            url: `https://whobee.live/blog/${slug}`,
            type: 'article',
            publishedTime: post.date,
            authors: [post.author],
            siteName: 'WHOBEE',
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: post.description,
        },
    };
}

export async function generateStaticParams() {
    const slugs = getPostSlugs();
    return slugs.map(slug => ({ slug }));
}

// Very simple inline markdown renderer — no heavy libs needed
function renderMarkdown(content: string): string {
    return content
        .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold text-slate-900 mt-8 mb-3">$1</h3>')
        .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-slate-900 mt-10 mb-4">$1</h2>')
        .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold text-slate-900 mt-6 mb-4">$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-slate-800">$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code class="bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
        .replace(/^\- (.+)$/gm, '<li class="flex gap-2 text-slate-600"><span class="text-indigo-500 font-bold mt-0.5">•</span><span>$1</span></li>')
        .replace(/(<li.*<\/li>\n?)+/g, '<ul class="space-y-2 my-4">$&</ul>')
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-indigo-600 font-semibold hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
        .replace(/^(?!<[h|u|l]).+$/gm, (line) => line.trim() ? `<p class="text-slate-600 leading-relaxed text-lg my-4">${line}</p>` : '')
        .replace(/---/g, '<hr class="my-10 border-slate-200" />');
}

const CATEGORY_COLORS: Record<string, string> = {
    'Safety': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Guide': 'bg-blue-100 text-blue-700 border-blue-200',
    'Technology': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'Comparison': 'bg-orange-100 text-orange-700 border-orange-200',
    'Feature': 'bg-purple-100 text-purple-700 border-purple-200',
    'Tips': 'bg-pink-100 text-pink-700 border-pink-200',
};

export default async function BlogPostPage({ params }: Props) {
    const { slug } = await params;
    const post = getPostBySlug(slug);
    if (!post) notFound();

    const articleSchema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": post.title,
        "description": post.description,
        "author": { "@type": "Organization", "name": post.author },
        "publisher": { "@type": "Organization", "name": "WHOBEE", "url": "https://whobee.live" },
        "datePublished": post.date,
        "url": `https://whobee.live/blog/${slug}`,
        "mainEntityOfPage": `https://whobee.live/blog/${slug}`,
    };

    const htmlContent = renderMarkdown(post.content);

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Script id="article-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
            
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-indigo-200/10 rounded-full blur-3xl" />
            </div>

            {/* Nav */}
            <header className="relative z-10 border-b border-white/60 bg-white/70 backdrop-blur-xl">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Logo size="md" animated={false} />
                    </Link>
                    <Link href="/blog" className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> All Articles
                    </Link>
                </div>
            </header>

            <main className="relative z-10 max-w-4xl mx-auto px-4 py-14">
                {/* Article header */}
                <div className="mb-10">
                    <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full border mb-5 ${CATEGORY_COLORS[post.category] || 'bg-slate-100 text-slate-600'}`}>
                        {post.category}
                    </span>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight mb-5 tracking-tight">
                        {post.title}
                    </h1>
                    <p className="text-xl text-slate-500 leading-relaxed mb-7">{post.description}</p>
                    <div className="flex flex-wrap items-center gap-5 text-sm text-slate-400 pb-8 border-b border-slate-200">
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />{post.readTime}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Tag className="w-4 h-4" />{post.author}
                        </span>
                    </div>
                </div>

                {/* Article content */}
                <article
                    className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-xl shadow-slate-200/50 border border-white"
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                />

                {/* CTA */}
                <div className="mt-12 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white text-center shadow-2xl shadow-purple-500/30">
                    <h3 className="text-2xl font-extrabold mb-2">Ready to Meet Someone New?</h3>
                    <p className="text-white/80 mb-6">Join thousands of users connecting right now. No sign-up, 100% free.</p>
                    <Link
                        href="/lobby"
                        className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-7 py-3.5 rounded-2xl hover:shadow-xl transition-all active:scale-95"
                    >
                        Start Chatting on WHOBEE →
                    </Link>
                </div>

                {/* Back link */}
                <div className="mt-8 text-center">
                    <Link href="/blog" className="text-slate-500 hover:text-indigo-600 font-semibold transition-colors text-sm flex items-center justify-center gap-1.5">
                        <ArrowLeft className="w-4 h-4" /> Back to All Articles
                    </Link>
                </div>
            </main>
        </div>
    );
}
