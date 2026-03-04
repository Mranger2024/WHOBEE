"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FuturisticLobby from "@/components/FuturisticLobby";
import { ArrowLeft, Map, Zap, Clock, FastForward } from "lucide-react";
import { WORLD_TOUR_SCHEDULE } from "@/lib/world-tour";

export default function WorldTourPage() {
    const router = useRouter();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <main className="bg-[#05050a] text-white min-h-screen font-sans">
            {/* Navigation */}
            <nav className={`fixed w-full z-[100] transition-all duration-300 ${scrolled ? 'bg-[#05050a]/90 backdrop-blur-xl border-b border-white/10 py-4' : 'py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-bold tracking-wide">Back to Earth</span>
                    </button>
                    <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 uppercase tracking-widest font-[family-name:var(--font-orbitron)]">
                        WHOBEE
                    </div>
                    <div className="w-24"></div> {/* Spacer for centering */}
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative h-screen w-full">
                <FuturisticLobby onEnterQueue={() => router.push('/lobby')} />

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center animate-bounce opacity-70">
                    <span className="text-[10px] uppercase tracking-widest mb-2 font-bold">Discover</span>
                    <div className="w-px h-8 bg-gradient-to-b from-white to-transparent" />
                </div>
            </section>

            {/* Info Section */}
            <section className="relative z-10 py-32 px-6 overflow-hidden">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />
                <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-pink-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-24">
                        <h2 className="text-sm font-bold text-indigo-400 tracking-[0.3em] uppercase mb-4">The Global Concept</h2>
                        <h3 className="text-5xl md:text-6xl font-black tracking-tight mb-8">What is the <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">World Tour</span>?</h3>
                        <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
                            To ensure you always find instant, high-quality connections, we compress our user base into high-density 2-hour &quot;Prime Time&quot; windows that rotate across the globe. When a region&apos;s window opens, matching is guaranteed to be instantaneous.
                        </p>
                    </div>

                    {/* Features */}
                    <div className="grid md:grid-cols-3 gap-8 mb-32">
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
                            <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/30">
                                <Zap className="w-6 h-6 text-indigo-400" />
                            </div>
                            <h4 className="text-2xl font-bold mb-4">Zero Cold Starts</h4>
                            <p className="text-slate-400 leading-relaxed">
                                No more waiting in empty queues. By concentrating the activity into prime time blocks, you get instantly paired with someone excited to chat.
                            </p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
                            <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/30">
                                <Map className="w-6 h-6 text-purple-400" />
                            </div>
                            <h4 className="text-2xl font-bold mb-4">Cultural Exchange</h4>
                            <p className="text-slate-400 leading-relaxed">
                                Travel the world from your screen. Each night opens the doors to a completely different continent, exposing you to new perspectives.
                            </p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
                            <div className="w-14 h-14 bg-pink-500/20 rounded-2xl flex items-center justify-center mb-6 border border-pink-500/30">
                                <FastForward className="w-6 h-6 text-pink-400" />
                            </div>
                            <h4 className="text-2xl font-bold mb-4">Weekend Free-For-All</h4>
                            <p className="text-slate-400 leading-relaxed">
                                Once the weekend hits, borders vanish. The entire globe comes online for a massive 48-hour matching festival.
                            </p>
                        </div>
                    </div>

                    {/* 5-Day Schedule */}
                    <div className="max-w-5xl mx-auto">
                        <h3 className="text-4xl font-black tracking-tight mb-12 text-center">The Region Rotation</h3>
                        <div className="space-y-4">
                            {WORLD_TOUR_SCHEDULE.map((region, idx) => (
                                <div key={region.id} className="group relative overflow-hidden bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between transition-colors gap-6 shadow-xl">
                                    <div className="flex items-center gap-6 z-10">
                                        <div className="text-4xl font-[family-name:var(--font-orbitron)] text-white/20 font-black w-12 text-center group-hover:text-indigo-400/50 transition-colors">
                                            0{idx + 1}
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black mb-2 flex flex-wrap items-center gap-3">
                                                {region.name}
                                                {region.id === 'global' && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/30 uppercase tracking-widest">Weekend</span>}
                                            </h4>
                                            <p className="text-slate-400 max-w-xl">{region.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col md:items-end z-10 shrink-0">
                                        <div className="flex items-center gap-2 text-indigo-300 font-bold bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20">
                                            <Clock className="w-4 h-4" />
                                            {region.durationHours} Hours LIVE
                                        </div>
                                    </div>

                                    {/* Hover gradient effect inside card */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[200%] group-hover:animate-[shimmer_2s_infinite] skew-x-12 pointer-events-none" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
