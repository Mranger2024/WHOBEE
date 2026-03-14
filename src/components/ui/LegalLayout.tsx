import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, FileText, Cookie, Users, Mail } from 'lucide-react';
import Logo from '@/components/Logo';

interface LegalLayoutProps {
    title: string;
    lastUpdated: string;
    icon: 'shield' | 'file-text' | 'cookie' | 'users' | 'mail';
    children: React.ReactNode;
}

const IconMap = {
    'shield': <Shield className="w-8 h-8 text-indigo-500" />,
    'file-text': <FileText className="w-8 h-8 text-indigo-500" />,
    'cookie': <Cookie className="w-8 h-8 text-indigo-500" />,
    'users': <Users className="w-8 h-8 text-indigo-500" />,
    'mail': <Mail className="w-8 h-8 text-indigo-500" />
};

export default function LegalLayout({ title, lastUpdated, icon, children }: LegalLayoutProps) {
    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden relative">
            
            {/* Background elements */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-indigo-200/20 rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
                <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-purple-200/20 rounded-full blur-3xl animate-[pulse_10s_ease-in-out_infinite_2s]" />
                <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-pink-200/20 rounded-full blur-3xl animate-[pulse_12s_ease-in-out_infinite_4s]" />
            </div>

            {/* Header Area */}
            <div className="relative z-10 pt-10 pb-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Top Nav */}
                    <div className="flex items-center justify-between mb-16">
                        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-semibold transition-colors bg-white/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/80 shadow-sm">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Home
                        </Link>
                        <div className="bg-white/50 backdrop-blur-sm p-1.5 rounded-2xl border border-white/80 shadow-sm">
                            <Logo size="sm" animated={false} />
                        </div>
                    </div>

                    {/* Title Section */}
                    <div className="text-center bg-white/40 backdrop-blur-xl border border-white/60 p-10 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] ring-1 ring-slate-900/5">
                        <div className="w-20 h-20 mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-6 rotate-3">
                            {IconMap[icon]}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
                            {title}
                        </h1>
                        <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100/80 text-slate-500 text-sm font-semibold border border-slate-200/50">
                            Last Updated: {lastUpdated}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <main className="relative z-10 pb-28 -mt-10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-14 shadow-2xl shadow-slate-200/50 border border-white">
                        <div className="prose prose-slate prose-indigo max-w-none 
                            prose-headings:font-bold prose-headings:tracking-tight 
                            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-slate-900
                            prose-p:text-slate-600 prose-p:leading-relaxed prose-p:text-lg
                            prose-ul:text-slate-600 prose-ul:text-lg
                            prose-li:marker:text-indigo-400
                            prose-strong:text-slate-800 prose-strong:font-bold
                            prose-a:text-indigo-600 prose-a:font-semibold prose-a:no-underline hover:prose-a:underline">
                            {children}
                        </div>
                    </div>
                    
                    {/* Simple footer just for these pages */}
                    <div className="mt-16 text-center">
                        <p className="text-slate-500 font-medium">© {new Date().getFullYear()} WHOBEE. All rights reserved.</p>
                        <div className="flex justify-center gap-6 mt-4 text-sm font-semibold text-slate-400">
                            <Link href="/privacy" className="hover:text-indigo-500 transition-colors">Privacy</Link>
                            <Link href="/terms" className="hover:text-indigo-500 transition-colors">Terms</Link>
                            <Link href="/contact" className="hover:text-indigo-500 transition-colors">Contact</Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
