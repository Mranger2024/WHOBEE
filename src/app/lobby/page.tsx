// app/lobby/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Settings, ArrowRight, Music, Heart, Gamepad, Film, Coffee, Dumbbell, Camera, Code, Mic, MessageSquare } from "lucide-react";
import dynamic from 'next/dynamic';

const FuturisticLobby = dynamic(() => import('@/components/FuturisticLobby'), { 
    ssr: false, 
    loading: () => (
        <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-gray-900/5 rounded-[2rem] animate-pulse">
            <div className="flex flex-col items-center gap-4 text-gray-400">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="font-orbitron font-medium tracking-widest text-sm">LOADING GLOBE...</p>
            </div>
        </div>
    ) 
});
import { getTourStatus, WindowStatus } from "@/lib/world-tour";
import NotificationModal from "@/components/NotificationModal";
import FeedbackButton from "@/components/ui/FeedbackButton";

const LobbyScreen = () => {
    const router = useRouter();

    // Preferences State
    const [gender, setGender] = useState<"male" | "female" | "other">("other");
    const [lookingFor, setLookingFor] = useState<"male" | "female" | "any">("any");
    const [interests, setInterests] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMode, setSelectedMode] = useState<'video' | 'voice' | 'text'>('video');
    const [tourStatus, setTourStatus] = useState<WindowStatus | null>(null);

    // Predefined interest options with icons
    const interestOptions = [
        { label: "Music", icon: Music },
        { label: "Sports", icon: Dumbbell },
        { label: "Gaming", icon: Gamepad },
        { label: "Movies", icon: Film },
        { label: "Technology", icon: Code },
        { label: "Food", icon: Coffee },
        { label: "Photography", icon: Camera },
        { label: "Dating", icon: Heart },
    ];

    // Load preferences and tour status on mount
    useEffect(() => {
        const saved = localStorage.getItem('chatPreferences');
        if (saved) {
            try {
                const prefs = JSON.parse(saved);
                setGender(prefs.gender || 'other');
                setLookingFor(prefs.lookingFor || 'any');
                setInterests(prefs.interests || []);
            } catch (err) {
                console.error('Failed to parse preferences:', err);
            }
        }

        // Check World Tour status
        setTourStatus(getTourStatus());
        // Periodically refresh the status so it unlocks automatically
        const interval = setInterval(() => setTourStatus(getTourStatus()), 5000);

        setIsLoading(false);
        return () => clearInterval(interval);
    }, []);

    // Save preferences to localStorage when they change
    useEffect(() => {
        if (!isLoading) {
            const prefs = { gender, lookingFor, interests };
            localStorage.setItem('chatPreferences', JSON.stringify(prefs));
        }
    }, [gender, lookingFor, interests, isLoading]);

    const toggleInterest = useCallback((interest: string) => {
        setInterests(prev =>
            prev.includes(interest)
                ? prev.filter(i => i !== interest)
                : [...prev, interest]
        );
    }, []);

    const handleStartChat = useCallback(() => {
        if (selectedMode === 'video') router.push('/random');
        else if (selectedMode === 'voice') router.push('/voice-chat');
        else if (selectedMode === 'text') router.push('/text-chat');
    }, [router, selectedMode]);

    if (isLoading) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>;
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 md:p-8 relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
            <NotificationModal />
            {/* Background decoration */}
            <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
                <div className="absolute top-10 left-10 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-[128px] animate-blob"></div>
                <div className="absolute top-10 right-10 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-[128px] animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-[128px] animate-blob animation-delay-4000"></div>
            </div>

            <Card className="w-full max-w-6xl glass-card backdrop-blur-2xl border-white/60 shadow-2xl z-10 bg-white/40 overflow-hidden flex flex-col md:flex-row min-h-[600px]">

                {/* LEFT SIDE: PREFERENCES */}
                <div className="w-full md:w-1/2 p-8 border-b md:border-b-0 md:border-r border-white/30 flex flex-col relative overflow-hidden group">
                    {/* Dynamic Background on Hover for Left Side */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg ring-2 ring-white/50">
                                <Settings className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Your Identity</h2>
                                <p className="text-sm text-gray-500">Tell us about yourself</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {/* Gender Selection */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    I am
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {(['male', 'female', 'other'] as const).map((g) => (
                                        <button
                                            key={g}
                                            onClick={() => setGender(g)}
                                            className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${gender === g
                                                ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-600 ring-offset-2'
                                                : 'bg-white/70 text-gray-600 hover:bg-white hover:text-blue-600 hover:shadow-md'
                                                }`}
                                        >
                                            <span className="capitalize">{g}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Looking For Selection */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    Looking For
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {(['male', 'female', 'any'] as const).map((lf) => (
                                        <button
                                            key={lf}
                                            onClick={() => setLookingFor(lf)}
                                            className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${lookingFor === lf
                                                ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-600 ring-offset-2'
                                                : 'bg-white/70 text-gray-600 hover:bg-white hover:text-indigo-600 hover:shadow-md'
                                                }`}
                                        >
                                            <span className="capitalize">{lf}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Interests Selection */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center justify-between">
                                    <span>Interests</span>
                                    <span className="text-[10px] bg-gray-200 px-2 py-0.5 rounded-full text-gray-500">{interests.length}/5</span>
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {interestOptions.map((item) => {
                                        const Icon = item.icon;
                                        const isSelected = interests.includes(item.label);
                                        const isDisabled = !isSelected && interests.length >= 5;

                                        return (
                                            <button
                                                key={item.label}
                                                onClick={() => toggleInterest(item.label)}
                                                disabled={isDisabled}
                                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 border ${isSelected
                                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent shadow-md transform scale-105'
                                                    : 'bg-white/60 text-gray-600 border-gray-200/50 hover:bg-white hover:border-blue-200'
                                                    } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                                            >
                                                <Icon className={`h-3 w-3 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                                                {item.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE: ROOM OPTIONS OR WORLD TOUR HUD */}
                <div className="w-full md:w-1/2 md:min-h-full flex flex-col relative bg-white/30 p-0 md:p-0">
                    {/* If the window is CLOSED, show the Futuristic Lobby taking up the whole right side */}
                    {tourStatus && !tourStatus.isOpen ? (
                        <div className="relative w-full h-full min-h-[500px]">
                            <FuturisticLobby onEnterQueue={() => setTourStatus(getTourStatus())} />
                        </div>
                    ) : (
                        <div className="p-8 flex flex-col justify-between h-full relative">
                            {/* Decoration */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200/20 rounded-bl-[100px] pointer-events-none"></div>

                            <div className="relative z-10 space-y-8">
                                <div>
                                    <h2 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
                                        Choose Your Experience
                                    </h2>
                                    <p className="text-gray-600">Select how you want to connect</p>
                                </div>

                                <div className="space-y-4">
                                    {/* Video Option */}
                                    <button
                                        onClick={() => setSelectedMode('video')}
                                        className={`w-full p-4 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4 group relative overflow-hidden ${selectedMode === 'video'
                                            ? 'border-blue-500 bg-white shadow-xl scale-[1.02]'
                                            : 'border-transparent bg-white/50 hover:bg-white hover:border-blue-200 hover:shadow-lg'
                                            }`}
                                    >
                                        <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${selectedMode === 'video' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                                            <Video className="h-6 w-6" />
                                        </div>
                                        <div className="text-left flex-1">
                                            <h3 className={`font-bold text-lg ${selectedMode === 'video' ? 'text-blue-700' : 'text-gray-700'}`}>Video Chat</h3>
                                            <p className="text-xs text-gray-500">Face-to-face with smart blur</p>
                                        </div>
                                        {selectedMode === 'video' && <div className="h-3 w-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"></div>}
                                    </button>

                                    {/* Voice Option */}
                                    <button
                                        onClick={() => setSelectedMode('voice')}
                                        className={`w-full p-4 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4 group relative overflow-hidden ${selectedMode === 'voice'
                                            ? 'border-purple-500 bg-white shadow-xl scale-[1.02]'
                                            : 'border-transparent bg-white/50 hover:bg-white hover:border-purple-200 hover:shadow-lg'
                                            }`}
                                    >
                                        <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${selectedMode === 'voice' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500 group-hover:bg-purple-50 group-hover:text-purple-500'}`}>
                                            <Mic className="h-6 w-6" />
                                        </div>
                                        <div className="text-left flex-1">
                                            <h3 className={`font-bold text-lg ${selectedMode === 'voice' ? 'text-purple-700' : 'text-gray-700'}`}>Voice Chat</h3>
                                            <p className="text-xs text-gray-500">Audio only, crystal clear</p>
                                        </div>
                                        {selectedMode === 'voice' && <div className="h-3 w-3 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50"></div>}
                                    </button>

                                    {/* Text Option */}
                                    <button
                                        onClick={() => setSelectedMode('text')}
                                        className={`w-full p-4 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4 group relative overflow-hidden ${selectedMode === 'text'
                                            ? 'border-pink-500 bg-white shadow-xl scale-[1.02]'
                                            : 'border-transparent bg-white/50 hover:bg-white hover:border-pink-200 hover:shadow-lg'
                                            }`}
                                    >
                                        <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${selectedMode === 'text' ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-500 group-hover:bg-pink-50 group-hover:text-pink-500'}`}>
                                            <MessageSquare className="h-6 w-6" />
                                        </div>
                                        <div className="text-left flex-1">
                                            <h3 className={`font-bold text-lg ${selectedMode === 'text' ? 'text-pink-700' : 'text-gray-700'}`}>Text Chat</h3>
                                            <p className="text-xs text-gray-500">Fast and simple messaging</p>
                                        </div>
                                        {selectedMode === 'text' && <div className="h-3 w-3 rounded-full bg-pink-500 shadow-lg shadow-pink-500/50"></div>}
                                    </button>
                                </div>
                            </div>

                            <div className="mt-8 space-y-4">
                                <Button
                                    onClick={handleStartChat}
                                    className={`w-full h-16 text-xl font-bold rounded-2xl bg-gradient-to-r shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden group border-0 ${selectedMode === 'video' ? 'from-blue-600 via-indigo-600 to-purple-600 hover:shadow-blue-500/30' :
                                        selectedMode === 'voice' ? 'from-purple-600 via-pink-600 to-red-600 hover:shadow-purple-500/30' :
                                            'from-pink-600 via-red-600 to-orange-600 hover:shadow-pink-500/30'
                                        }`}
                                >
                                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></span>
                                    <div className="flex items-center justify-center gap-3">
                                        {selectedMode === 'video' && <Video className="h-6 w-6 animate-pulse" />}
                                        {selectedMode === 'voice' && <Mic className="h-6 w-6 animate-bounce" />}
                                        {selectedMode === 'text' && <MessageSquare className="h-6 w-6 animate-pulse" />}
                                        <span>Start {selectedMode === 'video' ? 'Video' : selectedMode === 'voice' ? 'Voice' : 'Text'} Chat</span>
                                    </div>
                                </Button>

                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        onClick={() => router.push('/')}
                                        className="flex-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100/50"
                                    >
                                        <ArrowRight className="mr-2 h-4 w-4" />
                                        Back to Home
                                    </Button>
                                    <FeedbackButton variant="outline" className="flex-1" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default LobbyScreen;