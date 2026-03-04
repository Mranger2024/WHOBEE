'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    User, ArrowLeft, Star, Zap, Shield, Bell, ChevronRight,
    Eye, Globe, Lock, Sparkles, Video, Mic, MessageSquare,
    ToggleLeft, ToggleRight, LogOut, HelpCircle
} from 'lucide-react';

export default function MobileProfilePage() {
    const router = useRouter();
    const [notifOn, setNotifOn] = useState(true);
    const [blurReveal, setBlurReveal] = useState(true);
    const [showGender, setShowGender] = useState(false);
    const [lookingFor, setLookingFor] = useState<'any' | 'male' | 'female'>('any');

    const xp = 4200;
    const maxXp = 5000;
    const xpPct = Math.round((xp / maxXp) * 100);

    return (
        <main className="min-h-screen bg-slate-900 font-sans text-white pb-28 overflow-x-hidden relative">

            {/* Ambient glows */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute -top-32 -right-32 w-[350px] h-[350px] bg-indigo-600/10 rounded-full blur-[80px]" />
                <div className="absolute bottom-32 -left-32 w-[300px] h-[300px] bg-purple-600/8 rounded-full blur-[60px]" />
            </div>

            {/* ── HEADER CARD ── */}
            <div className="relative z-10 px-5">
                {/* Back */}
                <div className="flex items-center pt-12 pb-2">
                    <button onClick={() => router.push('/mobileUI/home')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        <span className="text-sm font-semibold">Back</span>
                    </button>
                </div>

                {/* Profile banner */}
                <div className="relative mt-4 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-pink-600/10 border border-white/10 rounded-3xl p-5 overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                    <div className="flex items-center gap-4 relative z-10">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-18 h-18 w-[4.5rem] h-[4.5rem] rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-[2px] shadow-xl shadow-indigo-500/30">
                                <div className="w-full h-full rounded-[14px] bg-slate-800 flex items-center justify-center">
                                    <User className="w-8 h-8 text-indigo-400" />
                                </div>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center border-2 border-slate-900 shadow-lg">
                                <Zap className="w-3 h-3 text-white fill-white" />
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                                <h1 className="text-xl font-extrabold text-white">Anonymous</h1>
                                <div className="flex items-center gap-1 bg-yellow-500/15 border border-yellow-500/20 rounded-full px-2 py-0.5">
                                    <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                                    <span className="text-[9px] font-extrabold text-yellow-400">PRO</span>
                                </div>
                            </div>
                            <p className="text-slate-400 text-xs font-medium mb-3">🌐 WHOBEE Explorer</p>

                            {/* XP bar */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Level 12 · {xp.toLocaleString()} XP</span>
                                    <span className="text-[10px] text-indigo-400 font-bold">{xpPct}%</span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-400 rounded-full transition-all duration-1000"
                                        style={{ width: `${xpPct}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-3 mt-5 relative z-10">
                        {[
                            { n: '248', l: 'Chats', color: 'text-indigo-400' },
                            { n: '4.9', l: 'Rating', color: 'text-yellow-400' },
                            { n: '12h', l: 'Total Time', color: 'text-pink-400' },
                        ].map((s, i) => (
                            <div key={i} className="bg-white/5 border border-white/8 rounded-2xl py-3 px-2 text-center">
                                <p className={`text-lg font-extrabold ${s.color} leading-none`}>{s.n}</p>
                                <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider mt-1">{s.l}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── SECTIONS ── */}
            <div className="px-5 mt-5 space-y-4 relative z-10">

                {/* Matching Preferences */}
                <Section title="Matching" icon={Sparkles} iconColor="text-indigo-400">
                    <div className="space-y-1">
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest px-1 pb-1">Chat Mode</p>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { mode: 'video', label: 'Video', icon: Video, color: 'from-indigo-500 to-purple-600' },
                                { mode: 'voice', label: 'Voice', icon: Mic, color: 'from-pink-500 to-rose-600' },
                                { mode: 'text', label: 'Text', icon: MessageSquare, color: 'from-cyan-500 to-blue-600' },
                            ].map(({ mode, label, icon: Icon, color }) => (
                                <button
                                    key={mode}
                                    onClick={() => router.push(`/mobileUI/lobby?mode=${mode}`)}
                                    className={`flex flex-col items-center gap-2 py-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 active:scale-95 transition-all`}
                                >
                                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                                        <Icon className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-300">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-3 space-y-1">
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest px-1 pb-1">Looking For</p>
                        <div className="grid grid-cols-3 gap-2">
                            {(['any', 'male', 'female'] as const).map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => setLookingFor(opt)}
                                    className={`py-2.5 rounded-2xl border text-xs font-bold capitalize transition-all active:scale-95 ${lookingFor === opt
                                        ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                                        : 'bg-white/5 border-white/10 text-slate-500 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    {opt === 'any' ? 'Anyone' : opt}
                                </button>
                            ))}
                        </div>
                    </div>
                </Section>

                {/* Privacy Settings */}
                <Section title="Privacy" icon={Shield} iconColor="text-green-400">
                    <ToggleRow
                        icon={Eye}
                        iconColor="text-indigo-400"
                        title="Blur Reveal"
                        subtitle="Start blurred, reveal over time"
                        value={blurReveal}
                        onChange={setBlurReveal}
                    />
                    <ToggleRow
                        icon={Lock}
                        iconColor="text-emerald-400"
                        title="Show Gender"
                        subtitle="Display your gender to strangers"
                        value={showGender}
                        onChange={setShowGender}
                    />
                </Section>

                {/* Notifications */}
                <Section title="Notifications" icon={Bell} iconColor="text-yellow-400">
                    <ToggleRow
                        icon={Bell}
                        iconColor="text-yellow-400"
                        title="Push Alerts"
                        subtitle="Match alerts and system updates"
                        value={notifOn}
                        onChange={setNotifOn}
                    />
                </Section>

                {/* App Info */}
                <Section title="App" icon={Globe} iconColor="text-slate-400">
                    {[
                        { icon: HelpCircle, label: 'Help & Support', color: 'text-indigo-400' },
                        { icon: Shield, label: 'Safety Guidelines', color: 'text-green-400' },
                        { icon: Globe, label: 'About WHOBEE', color: 'text-slate-400' },
                    ].map(({ icon: Icon, label, color }) => (
                        <button key={label} className="w-full flex items-center justify-between py-3 px-0 border-b border-white/5 last:border-0 group">
                            <div className="flex items-center gap-3">
                                <Icon className={`w-4 h-4 ${color}`} />
                                <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">{label}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                        </button>
                    ))}
                </Section>

                {/* Version */}
                <p className="text-center text-[10px] text-slate-700 font-medium">WHOBEE v2.0.0 · Made with 💜</p>
            </div>

            {/* ── BOTTOM NAV ── */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-2xl border-t border-white/10">
                <div className="relative flex justify-around items-center h-16 px-6">
                    <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-0">
                        <button
                            onClick={() => router.push('/mobileUI/lobby?mode=video')}
                            className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-purple-500/40 border-4 border-slate-900 active:scale-95"
                        >
                            <Video className="w-6 h-6 text-white" />
                        </button>
                    </div>
                    {[
                        { icon: Video, label: 'Home', action: () => router.push('/mobileUI/home') },
                        { icon: Mic, label: 'Voice', action: () => router.push('/mobileUI/lobby?mode=voice') },
                    ].map(({ icon: Icon, label, action }) => (
                        <button key={label} onClick={action} className="flex flex-col items-center gap-0.5 group">
                            <Icon className="w-5 h-5 text-slate-500 group-hover:text-slate-400" strokeWidth={2} />
                            <span className="text-[9px] font-semibold text-slate-600">{label}</span>
                        </button>
                    ))}
                    <div className="w-14" />
                    {[
                        { icon: MessageSquare, label: 'Chat', action: () => router.push('/mobileUI/lobby?mode=text') },
                        { icon: User, label: 'Profile', active: true, action: () => { } },
                    ].map(({ icon: Icon, label, active, action }) => (
                        <button key={label} onClick={action} className={`flex flex-col items-center gap-0.5 group`}>
                            <Icon className={`w-5 h-5 transition-colors ${active ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-400'}`} strokeWidth={active ? 2.5 : 2} />
                            <span className={`text-[9px] font-semibold ${active ? 'text-indigo-400' : 'text-slate-600'}`}>{label}</span>
                        </button>
                    ))}
                </div>
            </nav>
        </main>
    );
}

function Section({ title, icon: Icon, iconColor, children }: { title: string, icon: any, iconColor: string, children: React.ReactNode }) {
    return (
        <div className="bg-white/4 border border-white/8 rounded-3xl p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${iconColor}`} />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">{title}</h3>
            </div>
            {children}
        </div>
    );
}

function ToggleRow({ icon: Icon, iconColor, title, subtitle, value, onChange }: {
    icon: any, iconColor: string, title: string, subtitle: string, value: boolean, onChange: (v: boolean) => void
}) {
    return (
        <button onClick={() => onChange(!value)} className="w-full flex items-center justify-between py-2 group">
            <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${iconColor}`} />
                <div className="text-left">
                    <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{title}</p>
                    <p className="text-[10px] text-slate-600">{subtitle}</p>
                </div>
            </div>
            {value
                ? <div className="w-11 h-6 rounded-full bg-indigo-500/80 border border-indigo-400/30 flex items-center justify-end pr-1 transition-all shadow-inner shadow-black/20">
                    <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </div>
                : <div className="w-11 h-6 rounded-full bg-white/10 border border-white/10 flex items-center pl-1 transition-all">
                    <div className="w-4 h-4 rounded-full bg-slate-500" />
                </div>
            }
        </button>
    );
}
