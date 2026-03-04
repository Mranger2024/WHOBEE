"use client";

import React, { useEffect, useRef, useState } from "react";
import createGlobe from "cobe";
import { motion } from "framer-motion";
import { Globe, Zap, ArrowRight } from "lucide-react";
import { getTourStatus, formatLocalTime, WindowStatus } from "@/lib/world-tour";

type Props = {
    onEnterQueue: () => void;
};

export default function FuturisticLobby({ onEnterQueue }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [status, setStatus] = useState<WindowStatus | null>(null);
    const [timeLeft, setTimeLeft] = useState<{ hours: string; minutes: string; seconds: string } | null>(null);

    // Initialize status and live countdown
    useEffect(() => {
        const initialStatus = getTourStatus();
        setStatus(initialStatus);

        // Live countdown interval
        const intervalId = setInterval(() => {
            const currentStatus = getTourStatus();
            setStatus(currentStatus);

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

    // Initialize the futuristic WebGL Globe
    useEffect(() => {
        let phi = 0;
        if (!canvasRef.current || !status?.nextEvent) return;

        // Focus the globe on the upcoming event
        const targetCoords = status.nextEvent.centerCoords;

        const globe = createGlobe(canvasRef.current, {
            devicePixelRatio: 2,
            width: 800 * 2,
            height: 800 * 2,
            phi: 0,
            theta: 0.3,
            dark: 1, // Futuristic dark mode
            diffuse: 1.2,
            mapSamples: 16000,
            mapBrightness: 6,
            baseColor: [0.1, 0.1, 0.2], // Dark blueish base
            markerColor: [0.5, 0.4, 1], // Neon purple markers
            glowColor: [0.1, 0.1, 0.3], // Atmospheric glow
            markers: [
                { location: targetCoords, size: 0.1 },
            ],
            onRender: (state) => {
                // Auto-rotate the globe slowly
                state.phi = phi;
                phi += 0.005;
            },
        });

        return () => globe.destroy();
    }, [status?.nextEvent]);

    if (!status) return null; // Hydration guard

    return (
        <div className="absolute inset-0 bg-[#05050a] text-white flex flex-col items-center justify-center overflow-hidden font-sans z-50 rounded-xl">
            {/* Background Glow Effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

            {/* The 3D Globe */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute inset-0 flex items-center justify-center opacity-60 pointer-events-none z-0 mix-blend-screen"
            >
                <canvas
                    ref={canvasRef}
                    style={{ width: "800px", height: "800px", maxWidth: "100%", aspectRatio: 1 }}
                />
            </motion.div>

            {/* The HUD (Heads Up Display) */}
            <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="z-10 flex flex-col items-center text-center mb-10 p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl max-w-lg w-full mt-10 mx-4"
            >
                <div className="flex items-center gap-2 mb-4 bg-indigo-500/20 text-indigo-300 px-4 py-1.5 rounded-full border border-indigo-500/30 text-xs font-bold tracking-widest uppercase">
                    <Globe className="h-4 w-4" />
                    <span>WHOBEE WORLD TOUR</span>
                </div>

                {status.isOpen ? (
                    <>
                        {/* LIVE STATE HUD */}
                        <h1 className="text-5xl font-black mb-2 tracking-tight bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-transparent bg-clip-text uppercase">
                            {status.currentEvent?.name || "LIVE NOW"}
                        </h1>
                        <p className="text-slate-300 mb-8 text-lg font-medium">
                            The window is open. Immediate matching guaranteed.
                        </p>

                        <button
                            onClick={onEnterQueue}
                            className="group flex flex-col items-center justify-center bg-gradient-to-tr from-purple-600 via-pink-600 to-red-600 text-white rounded-2xl w-full p-4 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-emerald-500/25"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <Zap className="h-6 w-6 fill-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                                <span className="text-2xl font-black tracking-wide">ENTER QUEUE</span>
                            </div>
                            <span className="text-emerald-100 text-sm font-semibold flex items-center gap-1">
                                Instant connections <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </button>
                    </>
                ) : (
                    <>
                        {/* COUNTDOWN STATE HUD */}
                        <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 text-transparent bg-clip-text uppercase leading-tight">
                            {status.nextEvent.name}
                        </h1>

                        <p className="text-slate-300 mb-6 text-lg">
                            {status.nextEvent.description}
                        </p>

                        <div className="inline-flex items-center justify-center bg-white/10 px-4 py-2 rounded-xl border border-white/10 mb-8">
                            <span className="text-white/80 font-medium text-sm">
                                Queue opens at <span className="font-bold text-white">{formatLocalTime(status.nextOpenDate)}</span> your time
                            </span>
                        </div>

                        {/* Futuristic Countdown */}
                        {timeLeft && (
                            <div className="grid grid-cols-3 gap-3 md:gap-4 w-full mb-8">
                                {[
                                    { label: "HOURS", value: timeLeft.hours },
                                    { label: "MINUTES", value: timeLeft.minutes },
                                    { label: "SECONDS", value: timeLeft.seconds },
                                ].map((time, idx) => (
                                    <div key={idx} className="flex flex-col items-center justify-center bg-black/40 rounded-xl p-4 border border-white/10 shadow-inner backdrop-blur-md">
                                        <span className="text-4xl md:text-5xl font-[family-name:var(--font-orbitron)] text-white mb-2 tracking-widest">{time.value}</span>
                                        <span className="text-[10px] md:text-xs text-indigo-400 tracking-[0.2em] font-bold">{time.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Locked Button State */}
                        <button disabled className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 rounded-xl p-4 text-white/40 cursor-not-allowed mb-4">
                            <Zap className="h-5 w-5 opacity-50" />
                            <span className="text-sm font-bold tracking-widest uppercase">Queue Locked</span>
                        </button>

                        <p className="text-xs text-slate-500 mt-2 text-center">
                            Wait until the countdown reaches zero. You will be automatically redirected.
                        </p>
                    </>
                )}
            </motion.div>
        </div>
    );
}
