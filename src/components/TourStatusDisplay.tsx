"use client";
import React, { useState, useEffect } from 'react';
import { getTourStatus, formatLocalTime, WindowStatus } from '@/lib/world-tour';
import { Zap } from 'lucide-react';
import RegionMap from '@/components/RegionMap';
import { useRouter } from 'next/navigation';

export default function TourStatusDisplay() {
    const router = useRouter();
    const [tourStatus, setTourStatus] = useState<WindowStatus | null>(null);
    const [timeLeft, setTimeLeft] = useState<{ hours: string; minutes: string; seconds: string } | null>(null);

    useEffect(() => {
        // Initialize status and live countdown for world tour preview
        const initialStatus = getTourStatus();
        setTourStatus(initialStatus);

        const intervalId = setInterval(() => {
            const currentStatus = getTourStatus();
            setTourStatus(currentStatus);

            if (currentStatus.isOpen) {
                setTimeLeft(null);
            } else {
                const totalSeconds = currentStatus.secondsUntilNext;
                const h = Math.floor(totalSeconds / 3600);
                const m = Math.floor((totalSeconds % 3600) / 60);
                const s = totalSeconds % 60;

                setTimeLeft({
                    hours: h.toString().padStart(2, '0'),
                    minutes: m.toString().padStart(2, '0'),
                    seconds: s.toString().padStart(2, '0')
                });
            }
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    if (!tourStatus) return <div className="animate-pulse bg-white/5 w-full h-[400px] rounded-3xl border border-white/10" />;

    return tourStatus.isOpen ? (
        <div className="relative w-full h-full border border-purple-500/30 rounded-3xl bg-black/40 backdrop-blur-xl flex flex-col items-center justify-center p-8 overflow-hidden shadow-[0_0_50px_rgba(purple,0.3)]">
            <RegionMap regionId={tourStatus.currentEvent?.id || 'global'} className="w-24 h-24 text-purple-400 mb-6 drop-shadow-[0_0_15px_rgba(purple,0.5)]" />
            <h3 className="text-3xl font-black text-white text-center mb-2 tracking-tight uppercase">
                {tourStatus.currentEvent?.name || "LIVE NOW"}
            </h3>
            <p className="text-purple-300 text-sm mb-6 text-center font-bold animate-[pulse_2s_ease-in-out_infinite]">Window is Open. Instant Matches.</p>
            <button onClick={() => router.push('/lobby')} className="bg-purple-500 hover:bg-purple-400 text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-purple-500/20 active:scale-95 transition-all flex items-center gap-2">
                <Zap className="w-5 h-5 fill-white" /> Enter Matchmaking
            </button>
        </div>
    ) : (
        <div className="relative w-full h-full border border-white/10 rounded-3xl bg-black/40 backdrop-blur-xl flex flex-col items-center justify-center p-8 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <RegionMap regionId={tourStatus.nextEvent.id} className="w-48 h-48 text-indigo-400 mb-6 opacity-80" />
            <h3 className="text-2xl font-black text-white text-center mb-2 tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">
                {tourStatus.nextEvent.name}
            </h3>
            <p className="text-slate-400 text-sm mb-6 text-center">
                Doors open at <span className="text-white font-bold">{formatLocalTime(tourStatus.nextOpenDate)}</span>
            </p>
            <div className="text-center font-[family-name:var(--font-orbitron)] text-4xl text-white tracking-[0.1em] bg-black/60 px-8 py-5 rounded-2xl border border-white/10 shadow-inner">
                {timeLeft ? `${timeLeft.hours}:${timeLeft.minutes}:${timeLeft.seconds}` : "--:--:--"}
            </div>
        </div>
    );
}
