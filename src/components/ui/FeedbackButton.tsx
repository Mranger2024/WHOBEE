"use client";

import React from 'react';
import Link from 'next/link';
import { MessageSquarePlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedbackButtonProps {
    className?: string;
    variant?: 'default' | 'outline' | 'ghost' | 'floating';
    showText?: boolean;
}

export default function FeedbackButton({ 
    className, 
    variant = 'default', 
    showText = true 
}: FeedbackButtonProps) {
    
    const baseStyles = "inline-flex items-center gap-2 font-bold transition-all active:scale-95";
    
    const variants = {
        default: "bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-indigo-500/20",
        outline: "border-2 border-indigo-100 hover:border-indigo-200 bg-white/50 hover:bg-white text-indigo-600 px-4 py-2 rounded-xl",
        ghost: "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 px-3 py-1.5 rounded-lg",
        floating: "fixed bottom-6 right-6 z-50 bg-white border border-indigo-100 p-4 rounded-2xl shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 text-indigo-600 group"
    };

    return (
        <Link 
            href="/contact?subject=Feedback" 
            className={cn(baseStyles, variants[variant], className)}
        >
            <MessageSquarePlus className={cn("w-5 h-5", variant === 'floating' && "w-6 h-6")} />
            {showText && <span>Give Feedback</span>}
            {variant === 'floating' && !showText && (
                <span className="absolute right-full mr-3 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none mb-1">
                    Give Feedback
                </span>
            )}
        </Link>
    );
}
