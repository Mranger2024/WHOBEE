import { getAllPosts } from '@/lib/blog';
import Link from 'next/link';
import { Metadata } from 'next';
import { Calendar, Clock, ArrowRight, Tag, BookOpen, Sparkles } from 'lucide-react';
import Logo from '@/components/Logo';

export const metadata: Metadata = {
    title: 'Blog — Anonymous Chat Tips, Safety & Guides',
    description: 'The WHOBEE Blog. Read guides on online safety, tips for meeting people online, anonymous chat comparisons, and WebRTC technology deep-dives.',
    alternates: { canonical: 'https://whobee.live/blog' },
    openGraph: {
        title: 'WHOBEE Blog — Anonymous Chat Tips & Guides',
        description: 'Tips, guides, and insights on anonymous video chat, online safety, and connecting with strangers worldwide.',
        url: 'https://whobee.live/blog',
    }
};

const CATEGORY_COLORS: Record<string, string> = {
    'Safety': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Guide': 'bg-blue-100 text-blue-700 border-blue-200',
    'Technology': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'Comparison': 'bg-orange-100 text-orange-700 border-orange-200',
    'Feature': 'bg-purple-100 text-purple-700 border-purple-200',
    'Tips': 'bg-pink-100 text-pink-700 border-pink-200',
};

export default function BlogPage() {
    const posts = getAllPosts();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 font-sans">
            
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-indigo-200/15 rounded-full blur-3xl" />
                <div className="absolute top-1/2 -right-40 w-[400px] h-[400px] bg-purple-200/15 rounded-full blur-3xl" />
            </div>

            {/* Nav */}
            <header className="relative z-10 border-b border-white/50 bg-white/60 backdrop-blur-xl">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Logo size="md" animated={false} />
                    </Link>
                    <Link
                        href="/lobby"
                        className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl text-sm hover:shadow-lg hover:shadow-purple-500/25 transition-all active:scale-95"
                    >
                        Start Chatting →
                    </Link>
                </div>
            </header>

            <main className="relative z-10 max-w-6xl mx-auto px-4 py-16">
                {/* Hero */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100/80 text-indigo-700 text-sm font-bold border border-indigo-200/50 mb-5">
                        <BookOpen className="w-4 h-4" />
                        WHOBEE Blog
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
                        Tips, Guides & <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Insights</span>
                    </h1>
                    <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed">
                        Everything you need to know about anonymous chat, online safety, and connecting with people worldwide.
                    </p>
                </div>

                {posts.length === 0 ? (
                    <div className="text-center py-24">
                        <Sparkles className="w-12 h-12 text-indigo-300 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-slate-700 mb-2">Articles Coming Soon</h2>
                        <p className="text-slate-500">We're writing in-depth guides for you. Check back soon!</p>
                    </div>
                ) : (
                    <>
                        {/* Featured post */}
                        {posts[0] && (
                            <Link href={`/blog/${posts[0].slug}`} className="block group mb-10">
                                <div className="bg-white/80 backdrop-blur-xl border border-white shadow-xl shadow-slate-200/50 rounded-3xl p-8 md:p-10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                                    <div className="flex flex-wrap items-center gap-3 mb-5">
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${CATEGORY_COLORS[posts[0].category] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                            {posts[0].category}
                                        </span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">Featured</span>
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors leading-tight">
                                        {posts[0].title}
                                    </h2>
                                    <p className="text-slate-600 text-lg mb-6 leading-relaxed">{posts[0].description}</p>
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 text-sm text-slate-500">
                                            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{new Date(posts[0].date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{posts[0].readTime}</span>
                                        </div>
                                        <span className="flex items-center gap-1.5 text-indigo-600 font-bold text-sm group-hover:gap-2.5 transition-all">
                                            Read Article <ArrowRight className="w-4 h-4" />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        )}

                        {/* Rest of the posts */}
                        {posts.length > 1 && (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {posts.slice(1).map((post) => (
                                    <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
                                        <div className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-2xl p-6 h-full flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300 shadow-md shadow-slate-100">
                                            <span className={`self-start text-xs font-bold px-2.5 py-1 rounded-full border mb-4 ${CATEGORY_COLORS[post.category] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                {post.category}
                                            </span>
                                            <h3 className="font-extrabold text-slate-900 text-lg mb-2 group-hover:text-indigo-600 transition-colors leading-snug flex-1">
                                                {post.title}
                                            </h3>
                                            <p className="text-slate-500 text-sm mb-5 line-clamp-2 leading-relaxed">{post.description}</p>
                                            <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-100">
                                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime}</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-slate-200/50 mt-20 py-10 text-center">
                <p className="text-slate-400 text-sm">© {new Date().getFullYear()} WHOBEE. All rights reserved.</p>
                <div className="flex justify-center gap-6 mt-3 text-sm font-semibold text-slate-400">
                    <Link href="/privacy" className="hover:text-indigo-500 transition-colors">Privacy</Link>
                    <Link href="/terms" className="hover:text-indigo-500 transition-colors">Terms</Link>
                    <Link href="/contact" className="hover:text-indigo-500 transition-colors">Contact</Link>
                </div>
            </footer>
        </div>
    );
}
