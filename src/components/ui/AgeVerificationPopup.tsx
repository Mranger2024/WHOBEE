"use client";
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function AgeVerificationPopup() {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(false);
    const [isAgreed, setIsAgreed] = useState(false);

    // Only show on specific chat/lobby routes
    const isChatRoute = pathname && (
        pathname.includes('/lobby') || 
        pathname.includes('/random') || 
        pathname.includes('/text-chat') || 
        pathname.includes('/voice-chat') ||
        pathname.includes('/mobileUI')
    );

    useEffect(() => {
        // If not a chat route, don't show the popup
        if (!isChatRoute) {
            setIsVisible(false);
            return;
        }

        // Check local storage for previous verification
        const hasVerified = localStorage.getItem('whobee_age_verified');
        
        if (!hasVerified) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [pathname, isChatRoute]);

    const handleAgree = () => {
        setIsAgreed(true);
        localStorage.setItem('whobee_age_verified', 'true');
        
        // Add a slight delay for the exit animation
        setTimeout(() => {
            setIsVisible(false);
        }, 500);
    };

    if (!isVisible) return null;

    return (
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-500 ${isAgreed ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
            
            {/* Extremely strong blur background to completely hide the chat UI underneath */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-3xl" />
            
            {/* Modal Container */}
            <div className="relative w-full max-w-lg bg-white rounded-3xl p-8 md:p-10 shadow-[0_0_80px_rgba(0,0,0,0.3)] border border-white/50 animate-in zoom-in-95 duration-300">
                
                {/* Decorative header */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-t-3xl border-b border-indigo-100/50" />
                
                <div className="relative z-10 text-center mb-8">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30 rotate-3">
                        <ShieldAlert className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">18+ Age Verification</h2>
                    <p className="text-slate-600 font-medium">To keep this community safe, you must agree to our safety guidelines before entering.</p>
                </div>

                <div className="relative z-10 space-y-4 mb-8">
                    <div className="flex items-start gap-4 p-4 bg-red-50/50 border border-red-100 rounded-2xl">
                        <div className="bg-red-100 text-red-500 rounded-full w-8 h-8 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="font-bold text-sm">18+</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 text-sm mb-1">Strict Age Requirement</h4>
                            <p className="text-xs text-slate-600 leading-relaxed">You must be at least 18 years old to use WHOBEE. Minors are strictly prohibited.</p>
                        </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                        <AlertTriangle className="w-8 h-8 text-indigo-500 shrink-0 p-1.5 bg-indigo-100 rounded-full mt-0.5" />
                        <div>
                            <h4 className="font-bold text-slate-900 text-sm mb-1">Zero Tolerance Policy</h4>
                            <p className="text-xs text-slate-600 leading-relaxed">No harassment, hate speech, illegal acts, or nudity. Violators will face immediate, permanent IP bans.</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0 p-1.5 bg-emerald-100 rounded-full mt-0.5" />
                        <div>
                            <h4 className="font-bold text-slate-900 text-sm mb-1">Be Respectful</h4>
                            <p className="text-xs text-slate-600 leading-relaxed">Remember there is a real human on the other side. Treat them respectfully and consent safely.</p>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 space-y-4">
                    <button 
                        onClick={handleAgree}
                        className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 active:scale-95 transition-all text-lg"
                    >
                        I am 18+ & I Agree to the Rules
                    </button>
                    <p className="text-center text-xs text-slate-400 font-medium px-4">
                        By entering, you accept our <Link href="/terms" className="text-indigo-500 hover:underline">Terms of Service</Link> and <Link href="/guidelines" className="text-indigo-500 hover:underline">Community Guidelines</Link>.
                    </p>
                </div>
            </div>
        </div>
    );
}
