"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellRing, X, Sparkles } from 'lucide-react';
import { requestFirebaseToken } from '@/lib/firebase';

export default function NotificationModal() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Wait 3 seconds, then show if they haven't dismissed it
        const hasSeenPrompt = localStorage.getItem('whobee_notification_prompt');
        if (!hasSeenPrompt) {
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAllow = async () => {
        setIsVisible(false);
        localStorage.setItem('whobee_notification_prompt', 'allowed');

        try {
            if ('Notification' in window) {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    console.log('Notification permission granted.');

                    // Generate the FCM Token
                    const token = await requestFirebaseToken();

                    if (token) {
                        // Register token with our Next.js backend (saved to Redis)
                        await fetch('/api/notifications/subscribe', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ token })
                        });
                        console.log('Successfully subscribed to Traffic Surge notifications.');
                    }
                }
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('whobee_notification_prompt', 'dismissed');
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Minimalist Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-white/40 backdrop-blur-md"
                        onClick={handleDismiss}
                    />

                    {/* Elegant White Modal */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
                    >
                        <button
                            onClick={handleDismiss}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors z-10 p-2 bg-slate-50 hover:bg-slate-100 rounded-full"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="p-8 pb-6 flex flex-col items-center text-center relative z-10">
                            {/* Central Icon */}
                            <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 relative border border-indigo-100 shadow-sm">
                                <motion.div
                                    animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                                    transition={{ duration: 0.5, delay: 1, repeat: Infinity, repeatDelay: 4 }}
                                >
                                    <BellRing className="w-10 h-10 text-indigo-500" />
                                </motion.div>
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center border-4 border-white shadow-md">
                                    <Sparkles className="w-3.5 h-3.5 text-white" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Skip the Empty Rooms</h2>

                            <p className="text-slate-500 font-medium leading-relaxed mb-8 px-2">
                                Don't waste time waiting. We'll send you a quick ping the exact second your local region hits <span className="text-indigo-600 font-bold">Prime Time</span> so you can match instantly.
                            </p>

                            <div className="w-full space-y-3">
                                <button
                                    onClick={handleAllow}
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-[15px] transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 active:scale-[0.98] group relative overflow-hidden"
                                >
                                    <span className="relative z-10">Notify me when it's busy</span>
                                    <div className="absolute inset-0 bg-white/20 w-1/2 -skew-x-12 -translate-x-[150%] group-hover:animate-[shimmer_1.5s_infinite] z-0" />
                                </button>

                                <button
                                    onClick={handleDismiss}
                                    className="w-full py-3 rounded-xl bg-transparent hover:bg-slate-50 text-slate-400 hover:text-slate-600 font-bold text-[15px] transition-all active:scale-[0.98]"
                                >
                                    No thanks, I like waiting
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
