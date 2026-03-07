'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCentrifugo } from '@/context/CentrifugoProvider';
import {
    Mic, MicOff, Video, VideoOff, PhoneOff, SkipForward,
    MessageSquare, Flag, Heart, Smile, Zap, Wifi, RotateCcw
} from 'lucide-react';

export default function MobileVideoChatPage() {
    const router = useRouter();
    const { clientId, subscribe, publish, findRandomMatch } = useCentrifugo();

    const [isMicOn, setIsMicOn] = useState(true);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isFrontCamera, setIsFrontCamera] = useState(true);
    const [showControls, setShowControls] = useState(true);
    const [callDuration, setCallDuration] = useState(0);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isConnectedToPartner, setIsConnectedToPartner] = useState(false);
    const [localReaction, setLocalReaction] = useState<string | null>(null);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const hideTimeout = useRef<NodeJS.Timeout | null>(null);

    const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    // Get local camera + mic
    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true })
            .then(stream => {
                localStreamRef.current = stream;
                if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            })
            .catch(e => console.warn('Camera denied', e));
        return () => localStreamRef.current?.getTracks().forEach(t => t.stop());
    }, []);

    // Call timer
    useEffect(() => {
        if (!isConnectedToPartner) return;
        const t = setInterval(() => setCallDuration(d => d + 1), 1000);
        return () => clearInterval(t);
    }, [isConnectedToPartner]);

    // Auto-hide controls
    const resetHide = useCallback(() => {
        setShowControls(true);
        if (hideTimeout.current) clearTimeout(hideTimeout.current);
        hideTimeout.current = setTimeout(() => setShowControls(false), 5000);
    }, []);

    useEffect(() => { resetHide(); return () => { if (hideTimeout.current) clearTimeout(hideTimeout.current); }; }, []);

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
            if (data.type === 'disconnect' || data.type === 'skip') {
                setIsConnectedToPartner(false); setSessionId(null); setCallDuration(0);
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
            }
        });
        return unsub;
    }, [sessionId]);

    const toggleMic = () => { localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !isMicOn; }); setIsMicOn(p => !p); };
    const toggleVideo = () => { localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !isVideoOn; }); setIsVideoOn(p => !p); };

    const handleReaction = (emoji: string) => {
        setLocalReaction(emoji);
        setTimeout(() => setLocalReaction(null), 2000);
    };

    const handleEnd = useCallback(async () => {
        if (sessionId) { try { await publish(`session:${sessionId}`, { type: 'disconnect', from: clientId }); } catch { } }
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        router.push('/mobileUI/home');
    }, [sessionId, clientId, publish, router]);

    const handleSkip = useCallback(async () => {
        if (sessionId) { try { await publish(`session:${sessionId}`, { type: 'skip', from: clientId }); } catch { } }
        setIsConnectedToPartner(false); setSessionId(null); setCallDuration(0);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        try { await findRandomMatch(); } catch { }
    }, [sessionId, clientId, publish, findRandomMatch]);

    return (
        <main className="h-screen bg-black overflow-hidden relative flex flex-col font-sans" onClick={resetHide}>

            {/* ── REMOTE VIDEO (top half) ── */}
            <div className="relative flex-1 bg-slate-950 border-b border-white/5 overflow-hidden">
                <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />

                {/* Placeholder when no partner */}
                {!isConnectedToPartner && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                        {/* Blur preview mockup — the hallmark WHOBEE feature */}
                        <div className="relative w-28 h-28 rounded-full overflow-hidden border border-white/10">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-purple-900" />
                            <div className="absolute inset-0 backdrop-blur-[12px] flex items-center justify-center">
                                <Video className="w-10 h-10 text-white/10" />
                            </div>
                            <div className="absolute top-2 right-2 bg-black/50 rounded-full px-2 py-0.5 text-[8px] text-white/50 font-bold">
                                79% Blurred
                            </div>
                        </div>
                        <p className="text-slate-500 text-sm font-medium">Searching for a stranger...</p>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}

                {/* Top overlay: partner info */}
                <div className={`absolute top-0 left-0 right-0 p-4 flex justify-between items-start transition-all duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl rounded-full px-3 py-1.5 border border-white/10">
                        <div className="relative">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600" />
                            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-900 ${isConnectedToPartner ? 'bg-green-500' : 'bg-slate-600'}`} />
                        </div>
                        <span className="text-white text-xs font-bold">Stranger</span>
                        {isConnectedToPartner && (
                            <div className="flex items-center gap-1 ml-1 border-l border-white/20 pl-2">
                                <Wifi className="w-3 h-3 text-green-400" />
                                <span className="text-green-400 text-[10px] font-mono">{fmt(callDuration)}</span>
                            </div>
                        )}
                    </div>

                    <button className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 flex items-center justify-center text-red-400/60 hover:text-red-400 transition-colors">
                        <Flag className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Floating reaction */}
                {localReaction && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                        <span className="text-6xl animate-bounce drop-shadow-2xl">{localReaction}</span>
                    </div>
                )}

                {/* Gradient fade to local */}
                <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
            </div>

            {/* ── LOCAL VIDEO (bottom half) ── */}
            <div className="relative flex-1 bg-slate-950 overflow-hidden">
                <video ref={localVideoRef} autoPlay playsInline muted className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isVideoOn ? 'opacity-100' : 'opacity-0'}`} />
                {!isVideoOn && (
                    <div className="absolute inset-0 bg-slate-950 flex items-center justify-center">
                        <VideoOff className="w-10 h-10 text-slate-700" />
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                {/* YOU label */}
                <div className="absolute top-3 left-3 bg-black/30 backdrop-blur-sm rounded-full px-2. py-0.5 px-2 text-[9px] font-bold text-white/50 uppercase tracking-widest">
                    You
                </div>

                {/* Flip camera */}
                <div className={`absolute top-3 right-3 transition-all duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsFrontCamera(p => !p); }}
                        className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* ── CONTROLS ── */}
            <div className={`absolute bottom-6 left-4 right-4 z-30 flex flex-col items-center gap-3 transition-all duration-500 ease-out ${showControls ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`} onClick={e => e.stopPropagation()}>

                {/* Reactions */}
                <div className="flex gap-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full px-3 py-1.5">
                    {[['❤️', 'heart'], ['😂', 'laugh'], ['🔥', 'fire'], ['✨', 'sparkle']].map(([emoji, name]) => (
                        <button key={name} onClick={() => handleReaction(emoji)} className="w-8 h-8 rounded-full flex items-center justify-center hover:scale-125 active:scale-90 transition-transform text-base">
                            {emoji}
                        </button>
                    ))}
                </div>

                {/* Main controls */}
                <div className="w-full bg-black/70 backdrop-blur-2xl border border-white/10 rounded-[28px] p-2 flex items-center justify-between shadow-[0_8px_40px_rgba(0,0,0,0.6)] ring-1 ring-white/5">
                    {/* Mic */}
                    <VideoCtrl icon={isMicOn ? Mic : MicOff} active={isMicOn} onClick={toggleMic} />
                    {/* Video */}
                    <VideoCtrl icon={isVideoOn ? Video : VideoOff} active={isVideoOn} onClick={toggleVideo} />

                    {/* End call (center, raised) */}
                    <button
                        onClick={handleEnd}
                        className="w-14 h-12 rounded-[22px] bg-gradient-to-b from-red-500 to-red-600 flex items-center justify-center shadow-xl shadow-red-600/40 active:scale-90 transition-all border-t border-white/20 relative overflow-hidden group mx-0.5"
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <PhoneOff className="w-5 h-5 text-white relative z-10" />
                    </button>

                    {/* Chat */}
                    <VideoCtrl icon={MessageSquare} active={true} onClick={() => router.push('/mobileUI/text-chat')} />
                    {/* Skip */}
                    <button
                        onClick={handleSkip}
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 active:scale-90 transition-all border-t border-white/20 hover:brightness-110"
                    >
                        <SkipForward className="w-4 h-4 fill-white/20" />
                    </button>
                </div>
            </div>
        </main>
    );
}

function VideoCtrl({ icon: Icon, active, onClick }: { icon: any, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${active ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500/15 text-red-400 border border-red-500/20'}`}
        >
            <Icon className="w-[18px] h-[18px]" />
        </button>
    );
}
