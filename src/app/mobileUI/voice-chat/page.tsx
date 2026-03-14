'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCentrifugo } from '@/context/CentrifugoProvider';
import {
    Mic, MicOff, PhoneOff, Volume2, VolumeX,
    SkipForward, Flag, MessageSquare, ArrowLeft, Wifi
} from 'lucide-react';

export default function MobileVoiceChatPage() {
    const router = useRouter();
    const { clientId, isConnected, subscribe, publish, findVoiceMatch } = useCentrifugo();

    const [isMicOn, setIsMicOn] = useState(true);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [callDuration, setCallDuration] = useState(0);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isConnectedToPartner, setIsConnectedToPartner] = useState(false);

    const localStreamRef = useRef<MediaStream | null>(null);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    // Mic
    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => { localStreamRef.current = stream; })
            .catch(e => console.warn('Mic denied', e));
        return () => localStreamRef.current?.getTracks().forEach(t => t.stop());
    }, []);

    // Timer
    useEffect(() => {
        if (!isConnectedToPartner) return;
        const t = setInterval(() => setCallDuration(d => d + 1), 1000);
        return () => clearInterval(t);
    }, [isConnectedToPartner]);

    // Match subscription
    useEffect(() => {
        if (!clientId) return;
        const unsub = subscribe(`match_${clientId}`, (data: any) => {
            if (data.sessionId) { setSessionId(data.sessionId); setIsConnectedToPartner(true); }
        });
        return unsub;
    }, [clientId, subscribe]);

    // Session subscription
    useEffect(() => {
        if (!sessionId) return;
        const unsub = subscribe(`session:${sessionId}`, (data: any) => {
            if (data.type === 'disconnect' || data.type === 'skip' || data.type === 'partner-disconnected') {
                setIsConnectedToPartner(false); setSessionId(null); setCallDuration(0);
                setTimeout(() => { findVoiceMatch().catch(e => console.error(e)); }, 500);
            }
        });
        return unsub;
    }, [sessionId, subscribe, findVoiceMatch]);

    const toggleMic = () => {
        localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !isMicOn; });
        setIsMicOn(p => !p);
    };

    const handleEnd = useCallback(async () => {
        if (sessionId) { try { await publish(`session:${sessionId}`, { type: 'disconnect', from: clientId }); } catch { } }
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        router.push('/mobileUI/home');
    }, [sessionId, clientId, publish, router]);

    const handleSkip = useCallback(async () => {
        if (sessionId) { try { await publish(`session:${sessionId}`, { type: 'skip', from: clientId }); } catch { } }
        setIsConnectedToPartner(false); setSessionId(null); setCallDuration(0);
        try { await findVoiceMatch(); } catch { }
    }, [sessionId, clientId, publish, findVoiceMatch]);

    return (
        <main className="min-h-screen bg-slate-900 font-sans flex flex-col relative overflow-hidden text-white">

            {/* Background ambient */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-purple-600/8 rounded-full blur-[80px]" />
            </div>

            {/* ── HEADER ── */}
            <header className="relative z-20 flex justify-between items-center px-5 pt-12 pb-4">
                <button onClick={() => router.push('/mobileUI/home')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-sm font-semibold">End</span>
                </button>

                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-pink-400 uppercase tracking-widest">Voice Call</span>
                    </div>
                    {isConnectedToPartner && (
                        <div className="flex items-center gap-1.5 mt-1 bg-white/5 border border-white/10 rounded-full px-3 py-0.5">
                            <Wifi className="w-3 h-3 text-green-400" />
                            <span className="text-[10px] font-mono text-green-400">{formatTime(callDuration)}</span>
                        </div>
                    )}
                </div>

                {!isConnectedToPartner && (
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-wide text-yellow-400">Searching</span>
                    </div>
                )}
            </header>

            {/* ── AVATAR / VISUALIZER ── */}
            <div className="flex-1 relative z-10 flex flex-col items-center justify-center -mt-8">
                <div className="relative flex items-center justify-center w-64 h-64">

                    {/* Frequency rings */}
                    {isConnectedToPartner && (
                        <>
                            <div className="absolute inset-0 rounded-full border border-indigo-500/20 animate-[ping_3s_ease-in-out_infinite]" />
                            <div className="absolute inset-[8%] rounded-full border border-purple-500/15 animate-[ping_3.5s_ease-in-out_infinite_0.5s]" />
                            <div className="absolute inset-[16%] rounded-full border border-pink-500/10 animate-[ping_4s_ease-in-out_infinite_1s]" />
                        </>
                    )}

                    {/* Glow behind avatar */}
                    <div className={`absolute w-40 h-40 rounded-full blur-3xl transition-all duration-500 ${isConnectedToPartner ? 'bg-indigo-500/20 animate-pulse' : 'bg-slate-700/30'}`} />

                    {/* Avatar ring */}
                    <div className={`relative z-10 w-36 h-36 rounded-full p-[2px] transition-all duration-500 ${isConnectedToPartner ? 'bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_40px_rgba(99,102,241,0.4)]' : 'bg-white/10'}`}>
                        <div className="w-full h-full rounded-full bg-slate-900 border border-white/10 flex items-center justify-center overflow-hidden relative">
                            {/* Silhouette icon */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
                                    <Mic className="w-7 h-7 text-white/20" />
                                </div>
                            </div>
                            {/* Speaking pulse overlay */}
                            {isConnectedToPartner && isMicOn && (
                                <div className="absolute inset-0 bg-gradient-to-t from-indigo-600/40 to-transparent animate-[pulse_1.5s_ease-in-out_infinite]" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Name / status */}
                <div className="mt-8 text-center space-y-2">
                    <h2 className="text-2xl font-extrabold text-white">
                        {isConnectedToPartner ? 'Stranger' : 'Searching...'}
                    </h2>
                    <p className="text-slate-400 text-sm font-medium">
                        {isConnectedToPartner ? '🌐 Anonymous · WHOBEE' : 'Finding you a match'}
                    </p>
                    {!isConnectedToPartner && (
                        <div className="flex items-center justify-center gap-1 mt-2">
                            {[0, 1, 2].map(i => (
                                <div key={i} className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── CONTROLS ── */}
            <div className="relative z-20 p-5 pb-10">
                {/* Main control island */}
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 flex items-center justify-between">

                    {/* Report */}
                    <CtrlBtn icon={Flag} label="Report" onClick={() => { }} />

                    {/* Speaker */}
                    <CtrlBtn
                        icon={isSpeakerOn ? Volume2 : VolumeX}
                        label="Speaker"
                        active={isSpeakerOn}
                        onClick={() => setIsSpeakerOn(p => !p)}
                    />

                    {/* Mic — raised center */}
                    <div className="relative -top-8">
                        <div className="absolute inset-0 rounded-full blur-2xl bg-indigo-500/30 scale-150" />
                        <button
                            onClick={toggleMic}
                            className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 border-4 border-slate-900 shadow-xl ${isMicOn
                                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-indigo-500/40'
                                : 'bg-red-500/20 border-red-500/30 text-red-400 shadow-red-500/20'
                                }`}
                        >
                            {isMicOn ? <Mic className="w-6 h-6" strokeWidth={2.5} /> : <MicOff className="w-6 h-6" strokeWidth={2.5} />}
                        </button>
                    </div>

                    {/* End */}
                    <CtrlBtn icon={PhoneOff} label="End" onClick={handleEnd} isEnd />

                    {/* Skip */}
                    <CtrlBtn icon={SkipForward} label="Skip" onClick={handleSkip} />
                </div>

                {/* Switch to text */}
                <button
                    onClick={() => router.push('/mobileUI/lobby?mode=text')}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all text-sm font-semibold"
                >
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                    Switch to Text Chat
                </button>
            </div>
        </main>
    );
}

function CtrlBtn({ icon: Icon, label, onClick, active, isEnd }: { icon: any, label: string, onClick: () => void, active?: boolean, isEnd?: boolean }) {
    return (
        <div className="flex flex-col items-center gap-1.5">
            <button
                onClick={onClick}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-90 border ${isEnd
                    ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white'
                    : active
                        ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
            >
                <Icon className="w-5 h-5" strokeWidth={2} />
            </button>
            <span className="text-[9px] uppercase font-bold text-slate-600 tracking-widest">{label}</span>
        </div>
    );
}
