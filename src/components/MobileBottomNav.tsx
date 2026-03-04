'use client';

import React from 'react';
import { Home, Mic, MessageSquare, User, Video } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface NavIconProps {
    active: boolean;
    onClick: () => void;
    icon: React.ElementType;
    label: string;
}

function NavIcon({ active, onClick, icon: Icon, label }: NavIconProps) {
    return (
        <button
            onClick={onClick}
            className="group flex flex-col items-center justify-center gap-0.5 w-14"
        >
            <Icon
                className={`w-6 h-6 transition-all duration-300 ${active
                    ? 'text-indigo-600 fill-indigo-600/10 -translate-y-0.5 scale-110'
                    : 'text-gray-400 group-hover:text-gray-600 group-hover:scale-105'
                    }`}
                strokeWidth={active ? 2.5 : 2}
            />
            <span className={`text-[10px] font-semibold transition-colors duration-300 ${active ? 'text-indigo-600' : 'text-gray-400'}`}>
                {label}
            </span>
        </button>
    );
}

interface MobileBottomNavProps {
    activeTab: 'home' | 'audio' | 'chat' | 'profile';
}

export default function MobileBottomNav({ activeTab }: MobileBottomNavProps) {
    const router = useRouter();

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50">
            <div className="relative h-[80px] w-full bg-transparent flex items-end drop-shadow-[0_-5px_10px_rgba(0,0,0,0.05)]">
                {/* SVG Background Layer */}
                <div className="absolute inset-0 pointer-events-none">
                    <svg viewBox="0 0 375 80" className="w-full h-full" preserveAspectRatio="none">
                        <path d="M0,20 L135,20 Q187.5,90 240,20 L375,20 L375,80 L0,80 Z" fill="white" />
                    </svg>
                </div>

                {/* Floating Action Button */}
                <div className="absolute top-[0px] left-1/2 -translate-x-1/2 -translate-y-[40%] group pointer-events-auto">
                    <div className="absolute inset-0 rounded-full bg-indigo-500/30 blur-md animate-pulse" />
                    <button
                        onClick={() => router.push('/mobileUI/lobby?mode=video')}
                        className="relative w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/40 border-[6px] border-white active:scale-95 transition-transform group-hover:scale-110 group-hover:-translate-y-1"
                    >
                        <Video className="w-7 h-7 text-white ml-0.5 mt-0.5 animate-[pulse_3s_infinite]" strokeWidth={2.5} />
                    </button>
                </div>

                {/* Icons Row */}
                <div className="relative z-10 w-full h-[60px] flex justify-between px-2 pb-1 items-center">
                    <div className="flex flex-1 justify-around gap-3 pl-2 pr-2">
                        <NavIcon
                            icon={Home}
                            label="Home"
                            active={activeTab === 'home'}
                            onClick={() => router.push('/mobileUI/home')}
                        />
                        <NavIcon
                            icon={Mic}
                            label="Audio"
                            active={activeTab === 'audio'}
                            onClick={() => router.push('/mobileUI/lobby?mode=voice')}
                        />
                    </div>
                    <div className="w-16 shrink-0" />
                    <div className="flex flex-1 justify-around gap-3 pl-2 pr-2">
                        <NavIcon
                            icon={MessageSquare}
                            label="Chat"
                            active={activeTab === 'chat'}
                            onClick={() => router.push('/mobileUI/lobby?mode=text')}
                        />
                        <NavIcon
                            icon={User}
                            label="Profile"
                            active={activeTab === 'profile'}
                            onClick={() => router.push('/mobileUI/profile')}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
