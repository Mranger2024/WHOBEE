'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCentrifugo } from '@/context/CentrifugoProvider';
import { X, Video, Mic, MessageSquare, Globe, User, Settings, Sparkles, Zap, ArrowLeft } from 'lucide-react';

function LobbyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = (searchParams.get('mode') || 'video') as 'video' | 'voice' | 'text';
    const { isConnected, findRandomMatch, cancelRandomMatch, findVoiceMatch, cancelVoiceMatch, findTextMatch, cancelTextMatch, subscribe, clientId } = useCentrifugo();

    const [searchStatus, setSearchStatus] = useState('Looking for someone...');
    const [matchFound, setMatchFound] = useState(false);
    const [isCancelled, setIsCancelled] = useState(false);
    const [dotCount, setDotCount] = useState(0);

    const modeConfig = {
        video: { label: 'Video Chat', icon: Video, gradient: 'from-indigo-500 via-purple-500 to-pink-500', glow: 'shadow-purple-500/40', find: findRandomMatch, cancel: cancelRandomMatch, next: '/mobileUI/video-chat' },
        voice: { label: 'Voice Chat', icon: Mic, gradient: 'from-pink-500 via-rose-500 to-orange-500', glow: 'shadow-pink-500/40', find: findVoiceMatch, cancel: cancelVoiceMatch, next: '/mobileUI/voice-chat' },
        text: { label: 'Text Chat', icon: MessageSquare, gradient: 'from-cyan-500 via-blue-500 to-indigo-500', glow: 'shadow-cyan-500/40', find: findTextMatch, cancel: cancelTextMatch, next: '/mobileUI/text-chat' },
    };
    const cfg = modeConfig[mode];
    const ModeIcon = cfg.icon;

    const statusMessages = ['Looking for someone...', 'Scanning the globe...', 'Finding best match...', 'Almost there...'];

    useEffect(() => {
        const dotTimer = setInterval(() => setDotCount(d => (d + 1) % 4), 500);
        return () => clearInterval(dotTimer);
    }, []);

    useEffect(() => {
        if (!isConnected || isCancelled) return;
        let i = 0;
        const statusTimer = setInterval(() => { i = (i + 1) % statusMessages.length; setSearchStatus(statusMessages[i]); }, 2000);
        const startMatch = async () => { try { await cfg.find(); } catch (e) { console.error(e); } };
        startMatch();
        const unsub = subscribe(`match_${clientId}`, (data: any) => {
            if (data.type === 'matched' || data.sessionId || data.peerId) {
                clearInterval(statusTimer);
                setMatchFound(true);
                setSearchStatus('Match Found!');
                setTimeout(() => router.push(cfg.next), 800);
            }
        });
        return () => { clearInterval(statusTimer); unsub(); };
    }, [isConnected, isCancelled, clientId]);

    const handleCancel = useCallback(async () => {
        setIsCancelled(true);
        try { await cfg.cancel(); } catch { }
        router.push('/mobileUI/home');
    }, [cfg, router]);

    const dots = '.'.repeat(dotCount);

    return (
        <main className="min-h-screen bg-slate-900 font-sans flex flex-col relative overflow-hidden text-white">

            {/* Ambient glows */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[100px] opacity-20 bg-gradient-to-br ${cfg.gradient}`} />
            </div>

            {/* Back button */}
            <button onClick={() => router.push('/mobileUI/home')} className="absolute top-12 left-5 z-30 flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-semibold">Home</span>
            </button>

            {/* Mode badge */}
            <div className="absolute top-12 right-5 z-30">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${cfg.gradient} text-white text-xs font-bold shadow-lg ${cfg.glow}`}>
                    <ModeIcon className="w-3 h-3" />
                    {cfg.label}
                </div>
            </div>

            {/* ── MAIN AREA ── */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">

                {/* Radar rings */}
                <div className="relative flex items-center justify-center w-72 h-72 mb-10">
                    {!matchFound && (
                        <>
                            <div className="absolute inset-0 rounded-full border border-white/5 animate-[ping_3s_ease-in-out_infinite]" />
                            <div className="absolute inset-[15%] rounded-full border border-white/8 animate-[ping_3.5s_ease-in-out_infinite_0.5s]" />
                            <div className="absolute inset-[30%] rounded-full border border-white/10 animate-[ping_4s_ease-in-out_infinite_1s]" />
                        </>
                    )}

                    {/* Rotating conic gradient scanner */}
                    {!matchFound && (
                        <div className={`absolute inset-[5%] rounded-full bg-[conic-gradient(from_0deg,transparent_270deg,rgba(99,102,241,0.15)_360deg)] animate-spin`} style={{ animationDuration: '4s' }} />
                    )}

                    {/* Center orb */}
                    <div className={`relative z-20 w-32 h-32 rounded-full p-1 bg-gradient-to-br ${matchFound ? 'from-green-400 via-emerald-400 to-teal-400' : cfg.gradient} shadow-[0_0_60px_rgba(99,102,241,0.4)] transition-all duration-700`}>
                        <div className="w-full h-full rounded-full bg-slate-900 border border-white/10 flex items-center justify-center relative overflow-hidden">
                            {matchFound
                                ? <Sparkles className="w-14 h-14 text-green-300 animate-bounce" />
                                : <ModeIcon className="w-14 h-14 text-white/40 animate-pulse" />
                            }
                            {/* Scanning line */}
                            {!matchFound && (
                                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent animate-[scan_2s_linear_infinite]" />
                            )}
                        </div>
                        {/* Pulse badge */}
                        {!matchFound && (
                            <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br ${cfg.gradient} border-4 border-slate-900 flex items-center justify-center`}>
                                <Zap className="w-3.5 h-3.5 text-white fill-white" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Status text */}
                <div className="text-center space-y-3">
                    <h2 className={`text-2xl font-extrabold tracking-tight ${matchFound ? 'text-green-400' : 'text-white'}`}>
                        {matchFound ? '🎉 Match Found!' : `Finding ${cfg.label} Partner${dots}`}
                    </h2>
                    <p className="text-slate-400 text-sm font-medium">
                        {matchFound ? 'Connecting you now...' : searchStatus}
                    </p>
                    {!isConnected && (
                        <span className="inline-block text-yellow-400 text-xs font-bold bg-yellow-400/10 border border-yellow-400/20 px-3 py-1 rounded-full">
                            ⚠ Connecting to server...
                        </span>
                    )}
                </div>

                {/* Filter pills */}
                <div className="flex gap-2 mt-8">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-bold">
                        <Globe className="w-3 h-3 text-indigo-400" />
                        Global
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-bold">
                        <User className="w-3 h-3 text-pink-400" />
                        All Genders
                    </div>
                    <button className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                        <Settings className="w-4 h-4 text-slate-400" />
                    </button>
                </div>
            </div>

            {/* ── BOTTOM AREA ── */}
            <div className="relative z-10 p-6 pb-10 space-y-4">
                <button
                    onClick={handleCancel}
                    className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-red-400 font-bold text-base hover:bg-red-500/10 hover:border-red-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    <X className="w-5 h-5" strokeWidth={2.5} />
                    Cancel Search
                </button>
                <p className="text-center text-[10px] text-slate-600">
                    By using WHOBEE you agree to our <span className="text-slate-500 underline cursor-pointer">Terms</span> & <span className="text-slate-500 underline cursor-pointer">EULA</span>
                </p>
            </div>

            <style jsx>{`
                @keyframes scan {
                    0% { transform: translateY(-200%); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translateY(2000%); opacity: 0; }
                }
            `}</style>
        </main>
    );
}

export default function LobbyPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
            </div>
        }>
            <LobbyContent />
        </Suspense>
    );
}
