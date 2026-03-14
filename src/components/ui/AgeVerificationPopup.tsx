"use client";
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Scale, ShieldCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AgeVerificationPopup() {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(false);
    const [isAgreed, setIsAgreed] = useState(false);

    // Only show on active chat routes (EXCLUDES lobby to appear exactly when chatting starts)
    const isChatRoute = pathname && (
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
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-6 sm:p-4 transition-all duration-500 ${isAgreed ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
            
            {/* Deep blur and opaque dark overlay for serious tone */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" />
            
            {/* Minimalist Professional Modal Container */}
            <div className="relative w-full max-w-md bg-white rounded-[2rem] p-8 sm:p-10 shadow-2xl animate-in zoom-in-95 duration-300 mx-auto">
                
                {/* Header */}
                <div className="flex flex-col items-center text-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-indigo-50 rounded-[1.25rem] flex items-center justify-center shrink-0 mb-2">
                        <ShieldCheck className="w-8 h-8 text-indigo-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Before we connect you...</h2>
                        <p className="text-sm text-slate-500 mt-2">Let's keep WHOBEE fun and safe for everyone.</p>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-4 mb-10">
                    <div className="flex items-start gap-4 p-5 bg-slate-50/80 rounded-2xl border border-slate-100/50">
                        <AlertCircle className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-slate-900 text-[15px] mb-1">18+ Age Requirement</h4>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                You must be at least 18 years old to use WHOBEE. Minors are not permitted.
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-5 bg-slate-50/80 rounded-2xl border border-slate-100/50">
                        <Scale className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-slate-900 text-[15px] mb-1">Be Respectful</h4>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Treat others kindly. No harassment, inappropriate content, or illegal activities. Let's make good connections!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-5">
                    <button 
                        onClick={handleAgree}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-xl shadow-md active:scale-[0.98] transition-all text-lg"
                    >
                        I understand & I am 18+
                    </button>
                    <p className="text-center text-[13px] text-slate-500 px-4">
                        By entering, you agree to our <Link href="/terms" className="text-indigo-600 font-semibold hover:underline">Terms</Link> and <Link href="/guidelines" className="text-indigo-600 font-semibold hover:underline">Guidelines</Link>.
                    </p>
                </div>
            </div>
        </div>
    );
}
