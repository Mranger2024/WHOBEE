'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Video, Mic, MessageSquare, ChevronRight, Shield, Eye,
    Zap, Lock, Ghost, EyeOff, Bell, User, Sparkles, ArrowRight,
    Globe, Heart, Star
} from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/Logo';

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 18) return 'Good Afternoon';
    return 'Good Evening';
}

export default function MobileHomePage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('home');

    const trustBadges = [
        { icon: Ghost, label: 'Anonymous', sub: '100% Private', color: 'from-indigo-500/20 to-purple-500/20', border: 'border-indigo-500/20' },
        { icon: EyeOff, label: 'No Logs', sub: 'Zero Storage', color: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/20' },
        { icon: Lock, label: 'Encrypted', sub: 'E2E Secure', color: 'from-pink-500/20 to-rose-500/20', border: 'border-pink-500/20' },
        { icon: Shield, label: 'Safe', sub: 'Mod Tools', color: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/20' },
    ];
    const carousel = [...trustBadges, ...trustBadges, ...trustBadges];

    return (
        <main className="min-h-screen bg-slate-900 font-sans overflow-x-hidden selection:bg-indigo-500/30 relative pb-28 text-white">

            <style jsx>{`
                @keyframes scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-33.33%); }
                }
                .animate-scroll { animation: scroll 22s linear infinite; }
                .animate-scroll:hover { animation-play-state: paused; }
            `}</style>

            {/* Ambient background glows */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-1/2 -right-40 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute -bottom-40 left-1/3 w-[400px] h-[400px] bg-pink-600/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
            </div>

            {/* ─── HEADER ─── */}
            <header className="relative z-20 px-5 pt-12 pb-6 flex justify-between items-center">
                <div className="flex flex-col justify-center">
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mb-1">{getGreeting()}</p>
                    <Logo size="md" dark={true} />
                </div>
                <div className="flex items-center gap-2">
                    {/* Live indicator */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                        </span>
                        <span className="text-[10px] font-bold text-green-400">15k Online</span>
                    </div>
                    <button className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                        <Bell className="w-4 h-4 text-slate-400" />
                    </button>
                </div>
            </header>

            {/* ─── HERO CTA ─── */}
            <section className="relative z-10 px-5 mb-6">
                <div
                    onClick={() => router.push('/mobileUI/lobby?mode=video')}
                    className="relative overflow-hidden rounded-3xl cursor-pointer group active:scale-[0.98] transition-all duration-300"
                >
                    {/* Gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600" />
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/40 via-transparent to-pink-500/40 animate-pulse" />

                    {/* Fake blur preview */}
                    <div className="absolute top-4 right-4 bottom-4 w-[45%] rounded-2xl bg-slate-900/70 backdrop-blur-sm overflow-hidden border border-white/10">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                <User className="w-5 h-5 text-white/30" />
                            </div>
                        </div>
                        <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm rounded-full px-2 py-0.5 text-[9px] text-white/60 font-semibold">
                            79% Blurred
                        </div>
                        <div className="absolute inset-0 backdrop-blur-[6px]" />
                    </div>

                    {/* Content */}
                    <div className="relative z-10 p-6 pr-[50%]">
                        <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1 mb-4 text-[10px] font-bold text-white border border-white/20">
                            <Zap className="w-3 h-3 fill-yellow-300 text-yellow-300" />
                            Instant Match
                        </div>
                        <h2 className="text-2xl font-extrabold text-white leading-tight mb-1">Start Random<br />Video Chat</h2>
                        <p className="text-white/70 text-xs font-medium mb-4">Blur reveals as you connect</p>
                        <div className="inline-flex items-center gap-2 bg-white text-indigo-600 font-bold text-sm px-4 py-2 rounded-full shadow-lg group-hover:shadow-white/30 transition-shadow">
                            Start Now
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── TRUST BADGE CAROUSEL ─── */}
            <section className="mb-6 overflow-hidden relative">
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none" />
                <div className="flex w-max gap-3 pl-5 animate-scroll">
                    {carousel.map((b, i) => (
                        <div key={i} className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r ${b.color} border ${b.border} backdrop-blur-md min-w-max`}>
                            <b.icon className="w-4 h-4 text-white/70" />
                            <div>
                                <p className="text-white text-xs font-bold leading-none">{b.label}</p>
                                <p className="text-white/50 text-[9px] mt-0.5">{b.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── FEATURE GRID ─── */}
            <section className="px-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white text-sm">More Ways to Connect</h3>
                    <span className="text-indigo-400 text-xs font-bold">All Free</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {/* Voice Chat */}
                    <button
                        onClick={() => router.push('/mobileUI/lobby?mode=voice')}
                        className="group relative overflow-hidden bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3 text-left hover:bg-white/10 transition-all active:scale-[0.98]"
                    >
                        <div className="absolute top-0 right-0 w-20 h-20 bg-pink-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/30 group-hover:scale-110 transition-transform">
                            <Mic className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">Voice Chat</p>
                            <p className="text-slate-400 text-[10px]">Audio only</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-pink-400 transition-colors absolute bottom-4 right-4" />
                    </button>
                    {/* Text Chat */}
                    <button
                        onClick={() => router.push('/mobileUI/lobby?mode=text')}
                        className="group relative overflow-hidden bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3 text-left hover:bg-white/10 transition-all active:scale-[0.98]"
                    >
                        <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform">
                            <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">Text Chat</p>
                            <p className="text-slate-400 text-[10px]">Anonymous DMs</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors absolute bottom-4 right-4" />
                    </button>
                </div>
            </section>

            {/* ─── FEATURES MINI CARDS ─── */}
            <section className="px-5 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <h3 className="font-bold text-white text-sm">Why WHOBEE?</h3>
                </div>
                <div className="space-y-2">
                    {[
                        { icon: Eye, title: 'Phased Blur Reveal', desc: 'Start blurred, reveal as trust grows', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                        { icon: Globe, title: 'Global Matching', desc: '150+ countries, instant connection', color: 'text-purple-400', bg: 'bg-purple-500/10' },
                        { icon: Heart, title: 'Ice Breakers', desc: 'Never run out of things to say', color: 'text-pink-400', bg: 'bg-pink-500/10' },
                    ].map((f, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/8 transition-colors">
                            <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center shrink-0`}>
                                <f.icon className={`w-5 h-5 ${f.color}`} />
                            </div>
                            <div>
                                <p className="text-white font-bold text-sm">{f.title}</p>
                                <p className="text-slate-400 text-xs">{f.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── STATS ROW ─── */}
            <section className="px-5 mb-6">
                <div className="grid grid-cols-3 gap-3">
                    {[{ n: '10M+', l: 'Chats' }, { n: '150+', l: 'Countries' }, { n: '0', l: 'Sign-ups' }].map((s, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                            <p className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">{s.n}</p>
                            <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider mt-0.5">{s.l}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── BOTTOM NAV ─── */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-2xl border-t border-white/10 safe-area-inset-bottom">
                <div className="relative flex justify-around items-center h-16 px-6">
                    {/* Center FAB */}
                    <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-0">
                        <button
                            onClick={() => router.push('/mobileUI/lobby?mode=video')}
                            className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-purple-500/40 border-4 border-slate-900 active:scale-95 transition-transform hover:scale-105"
                        >
                            <Video className="w-6 h-6 text-white" />
                        </button>
                    </div>
                    <NavIcon icon={Video} label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
                    <NavIcon icon={Mic} label="Voice" active={activeTab === 'audio'} onClick={() => router.push('/mobileUI/lobby?mode=voice')} />
                    <div className="w-14" />
                    <NavIcon icon={MessageSquare} label="Chat" active={activeTab === 'chat'} onClick={() => router.push('/mobileUI/lobby?mode=text')} />
                    <NavIcon icon={User} label="Profile" active={activeTab === 'profile'} onClick={() => router.push('/mobileUI/profile')} />
                </div>
            </nav>
        </main>
    );
}

function NavIcon({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
    return (
        <button onClick={onClick} className="flex flex-col items-center gap-0.5 group">
            <Icon className={`w-5 h-5 transition-all duration-200 ${active ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-400'}`} strokeWidth={active ? 2.5 : 2} />
            <span className={`text-[9px] font-semibold transition-colors ${active ? 'text-indigo-400' : 'text-slate-600'}`}>{label}</span>
        </button>
    );
}
