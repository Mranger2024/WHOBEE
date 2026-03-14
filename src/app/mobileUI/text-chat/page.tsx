'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCentrifugo } from '@/context/CentrifugoProvider';
import {
    Send, Smile, MoreHorizontal, ArrowLeft, SkipForward,
    CheckCheck, Plus, PhoneOff, Paperclip, Lock
} from 'lucide-react';

interface Message {
    id: string;
    text: string;
    sender: 'me' | 'partner';
    time: string;
}

export default function MobileTextChatPage() {
    const router = useRouter();
    const { clientId, subscribe, publish, findTextMatch } = useCentrifugo();

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isConnectedToPartner, setIsConnectedToPartner] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

    // Match
    useEffect(() => {
        if (!clientId) return;
        const unsub = subscribe(`match_${clientId}`, (data: any) => {
            if (data.sessionId) {
                setSessionId(data.sessionId);
                setIsConnectedToPartner(true);
                setMessages([{ id: 'sys', text: "You're connected. Say hello 👋", sender: 'partner', time: 'now' }]);
            }
        });
        return unsub;
    }, [clientId, subscribe]);

    // Session
    useEffect(() => {
        if (!sessionId) return;
        const unsub = subscribe(`session_${sessionId}`, (data: any) => {
            if (data.type === 'chat' && data.from !== clientId) {
                setIsTyping(false);
                setMessages(p => [...p, { id: Date.now().toString(), text: data.text, sender: 'partner', time: 'now' }]);
            } else if (data.type === 'typing' && data.from !== clientId) {
                setIsTyping(true);
                if (typingRef.current) clearTimeout(typingRef.current);
                typingRef.current = setTimeout(() => setIsTyping(false), 3000);
            } else if (data.type === 'disconnect' || data.type === 'skip' || data.type === 'partner-disconnected') {
                setMessages(p => [...p, { id: 'sys-end', text: 'Stranger disconnected.', sender: 'partner', time: 'now' }]);
                setIsConnectedToPartner(false);
                setTimeout(() => {
                    handleSkip();
                }, 1500);
            }
        });
        return unsub;
    }, [sessionId, clientId, subscribe]);

    const handleSend = useCallback(async () => {
        if (!inputValue.trim() || !sessionId) return;
        const text = inputValue.trim();
        setInputValue('');
        setMessages(p => [...p, { id: Date.now().toString(), text, sender: 'me', time: 'now' }]);
        try { await publish(`session:${sessionId}`, { type: 'chat', text, from: clientId }); } catch { }
    }, [inputValue, sessionId, clientId, publish]);

    const handleTyping = useCallback(async (val: string) => {
        setInputValue(val);
        if (!sessionId) return;
        try { await publish(`session:${sessionId}`, { type: 'typing', from: clientId }); } catch { }
    }, [sessionId, clientId, publish]);

    const handleSkip = useCallback(async () => {
        if (sessionId) { try { await publish(`session:${sessionId}`, { type: 'skip', from: clientId }); } catch { } }
        setIsConnectedToPartner(false); setSessionId(null); setMessages([]);
        try { await findTextMatch(); } catch { }
    }, [sessionId, clientId, publish, findTextMatch]);

    const handleEnd = useCallback(async () => {
        if (sessionId) { try { await publish(`session:${sessionId}`, { type: 'disconnect', from: clientId }); } catch { } }
        router.push('/mobileUI/home');
    }, [sessionId, clientId, publish, router]);

    return (
        <main className="h-screen bg-slate-900 font-sans flex flex-col relative overflow-hidden text-white">

            {/* Subtle bg gradient */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute -top-40 -left-20 w-[350px] h-[350px] bg-indigo-600/8 rounded-full blur-[80px]" />
                <div className="absolute -bottom-40 right-0 w-[300px] h-[300px] bg-purple-600/8 rounded-full blur-[60px]" />
            </div>

            {/* ── HEADER ── */}
            <header className="relative z-20 bg-slate-900/80 backdrop-blur-xl border-b border-white/8 px-4 pt-12 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={handleEnd} className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all -ml-1">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[1.5px] shadow-lg shadow-indigo-500/30">
                                <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-sm">S</div>
                            </div>
                            <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${isConnectedToPartner ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`} />
                        </div>
                        <div>
                            <p className="font-bold text-white text-sm leading-none">Stranger</p>
                            <p className={`text-[10px] font-medium mt-0.5 ${isConnectedToPartner ? 'text-green-400' : 'text-slate-500'}`}>
                                {isConnectedToPartner ? 'Connected' : 'Searching...'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isConnectedToPartner && (
                        <button onClick={handleSkip} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold hover:bg-indigo-500/20 transition-all active:scale-95">
                            <SkipForward className="w-3.5 h-3.5" />
                            Next
                        </button>
                    )}
                    <button onClick={handleEnd} className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all active:scale-95">
                        <PhoneOff className="w-4 h-4" />
                    </button>
                    <button className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-all">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* ── MESSAGES ── */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-28">
                {/* Empty state */}
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-4 py-20">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                            <Lock className="w-8 h-8 text-indigo-400/50" />
                        </div>
                        <p className="text-slate-500 text-sm text-center font-medium max-w-[200px]">
                            End-to-end anonymous chat. No logs stored.
                        </p>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}

                {/* Date divider */}
                {messages.length > 0 && (
                    <div className="flex items-center justify-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 bg-white/3 border border-white/5 px-3 py-1 rounded-full">Today</span>
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm font-medium leading-snug relative ${msg.sender === 'me'
                            ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-tr-sm shadow-lg shadow-indigo-500/20'
                            : 'bg-white/8 border border-white/10 text-slate-200 rounded-tl-sm'
                            }`}>
                            <p>{msg.text}</p>
                            <div className={`flex items-center justify-end gap-1 mt-1 ${msg.sender === 'me' ? 'text-indigo-200/60' : 'text-slate-600'}`}>
                                <span className="text-[9px]">{msg.time}</span>
                                {msg.sender === 'me' && <CheckCheck className="w-3 h-3" />}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white/8 border border-white/10 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                            {[0, 1, 2].map(i => (
                                <div key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                            ))}
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* ── INPUT ── */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent pt-8 px-4 pb-6 z-20">
                <div className={`flex items-end gap-2 bg-white/5 border backdrop-blur-xl rounded-3xl p-1.5 transition-all duration-300 ${isConnectedToPartner ? 'border-white/15 focus-within:border-indigo-500/40 focus-within:bg-indigo-500/5 focus-within:shadow-lg focus-within:shadow-indigo-500/10' : 'border-white/5 opacity-50 pointer-events-none'}`}>
                    <button className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-indigo-400 hover:bg-white/10 transition-all">
                        <Plus className="w-5 h-5" />
                    </button>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={e => handleTyping(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        placeholder={isConnectedToPartner ? 'Type a message...' : 'Waiting for match...'}
                        disabled={!isConnectedToPartner}
                        className="flex-1 bg-transparent outline-none text-white placeholder:text-slate-600 text-sm font-medium py-2 min-w-0"
                    />
                    <button className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-yellow-400 hover:bg-white/10 transition-all">
                        <Smile className="w-5 h-5" />
                    </button>
                    {inputValue.trim()
                        ? <button onClick={handleSend} className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all">
                            <Send className="w-4 h-4 text-white ml-0.5" />
                        </button>
                        : <button className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/10 transition-all">
                            <Paperclip className="w-5 h-5" />
                        </button>
                    }
                </div>
            </div>
        </main>
    );
}
