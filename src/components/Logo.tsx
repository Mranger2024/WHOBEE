import React from 'react';
import { Sparkles } from 'lucide-react';

interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showText?: boolean;
    animated?: boolean;
    dark?: boolean;
}

export default function Logo({
    className = '',
    size = 'md',
    showText = true,
    animated = true,
    dark = false,
}: LogoProps) {
    const sizes = {
        sm: { icon: 'w-6 h-6', box: 'w-8 h-8 rounded-lg', text: 'text-xl', gap: 'gap-2.5', stroke: '2.5' },
        md: { icon: 'w-8 h-8', box: 'w-12 h-12 rounded-xl', text: 'text-2xl', gap: 'gap-3', stroke: '2.5' },
        lg: { icon: 'w-12 h-12', box: 'w-16 h-16 rounded-2xl', text: 'text-3xl', gap: 'gap-4', stroke: '2' },
        xl: { icon: 'w-16 h-16', box: 'w-24 h-24 rounded-3xl', text: 'text-5xl', gap: 'gap-5', stroke: '2' },
    };

    const s = sizes[size];

    return (
        <div className={`flex items-center ${s.gap} group ${className}`}>
            {/* Logo Icon Box */}
            <div className={`
                ${s.box} 

                flex items-center justify-center 
                shadow-lg shadow-purple-500/25 
                relative overflow-hidden 
                ${animated ? 'group-hover:scale-110 group-active:scale-95 transition-all duration-300' : ''}
            `}>
                {/* Shimmer effect */}
                {animated && (
                    <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] skew-x-12" />
                )}

                {/* Custom Image Logo */}
                <div className="relative z-10 w-full h-full flex items-center justify-center p-0.5">
                    <img
                        src="/whobee.png"
                        alt="WHOBEE Logo"
                        className="w-full h-full object-contain drop-shadow-md"
                    />
                </div>

            </div>

            {/* Logo Text */}
            {showText && (
                <span className={`
                    ${s.text} 
                    font-extrabold tracking-tight 
                    ${dark
                        ? 'text-white'
                        : 'bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600'
                    }
                    ${animated ? 'group-hover:opacity-80 transition-opacity duration-300' : ''}
                `}>
                    WHOBEE
                </span>
            )}

            <style jsx>{`
                @keyframes shimmer {
                    100% { transform: translateX(200%); }
                }
            `}</style>
        </div>
    );
}
