"use client";

import React, { useEffect, useCallback, useState, useRef } from "react";
import { useCentrifugo } from "@/context/CentrifugoProvider";
import { Button } from "@/components/ui/button";
import { Send, SkipForward, PhoneOff, Loader2, MessageSquare, Flag, Sparkles, Video, ArrowLeft, Shield, X, Share2, Copy, ShieldCheck, Heart } from "lucide-react";
import Link from "next/link";
import confetti from 'canvas-confetti';
import Logo from '@/components/Logo';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generateE2EKeyPair, exportPublicKey, importPublicKey, deriveSharedSecret, encryptMessage, decryptMessage, EncryptedPayload } from '@/lib/encryption';
import "@/app/globals.css";

interface Message {
    id: string;
    text: string;
    sender: 'me' | 'stranger';
    timestamp: Date;
}

const TextChatPage = () => {
    const { clientId, isConnected, subscribe, publish, findTextMatch, cancelTextMatch } = useCentrifugo();

    const [remotePeerId, setRemotePeerId] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isConnectedToPartner, setIsConnectedToPartner] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [reportStatus, setReportStatus] = useState<{ success?: boolean; message?: string } | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [isSecure, setIsSecure] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const myKeyPairRef = useRef<CryptoKeyPair | null>(null);
    const sharedSecretRef = useRef<CryptoKey | null>(null);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
    useEffect(() => {
        if (isConnectedToPartner && inputRef.current) {
            inputRef.current.focus();
            // Trigger celebration
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#6366f1', '#a855f7', '#ec4899']
            });
        }
    }, [isConnectedToPartner]);

    const startTextChat = useCallback(async () => {
        setIsSearching(true); setMessages([]);
        try {
            await findTextMatch();
        } catch (error) {
            console.error("Error starting text chat:", error);
            setIsSearching(false);
        }
    }, [findTextMatch]);

    const handleMatchFound = useCallback(async (data: any) => {
        if (data.type !== 'text-match-found') return;
        setRemotePeerId(data.partnerId); setSessionId(data.sessionId);
        setIsSearching(false); setIsConnectedToPartner(true);
        setMessages([{ id: Date.now().toString(), text: "You're now connected with a random stranger. Say hi! 👋", sender: 'me', timestamp: new Date() }]);

        // 🔒 Generate an ephemeral E2E keypair uniquely for this session
        try {
            const keys = await generateE2EKeyPair();
            myKeyPairRef.current = keys;
            const pubJwk = await exportPublicKey(keys.publicKey);

            // Publish our public key so they can derive the AES shared secret
            publish(`session:${data.sessionId}`, {
                type: 'public-key',
                key: pubJwk,
                from: clientId
            });
        } catch (error) {
            console.error('Error generating crypto keys', error);
        }
    }, [clientId, publish]);

    const endCurrentChat = useCallback(async () => {
        if (sessionId) publish(`session:${sessionId}`, { type: 'partner-disconnected', from: clientId });
        await cancelTextMatch();
        setRemotePeerId(null); setSessionId(null); setIsConnectedToPartner(false);
        setIsSearching(false); setMessages([]); setIsTyping(false);
        setIsSecure(false);
        myKeyPairRef.current = null;
        sharedSecretRef.current = null;
    }, [sessionId, clientId, publish, cancelTextMatch]);

    const handleIncomingMessage = useCallback(async (data: any) => {
        if (data.type === 'text-message' && data.from !== clientId) {
            let messageText = data.text;
            // 🔒 Decrypt if E2E is active
            if (data.encrypted && sharedSecretRef.current) {
                try {
                    messageText = await decryptMessage(sharedSecretRef.current, { iv: data.iv, data: data.encryptedData });
                } catch (e) {
                    console.error('E2E Decryption failed', e);
                    messageText = "🔒 [Message corrupted or could not be decrypted]";
                }
            }
            setMessages(prev => [...prev, { id: Date.now().toString(), text: messageText, sender: 'stranger', timestamp: new Date() }]);
            setIsTyping(false);
        } else if (data.type === 'public-key' && data.from !== clientId) {
            // 🔒 Received partner's public key. Derive the matching AES shared secret
            if (myKeyPairRef.current) {
                try {
                    const partnerPublicKey = await importPublicKey(data.key);
                    const sharedSecret = await deriveSharedSecret(myKeyPairRef.current.privateKey, partnerPublicKey);
                    sharedSecretRef.current = sharedSecret;
                    setIsSecure(true);

                    // Add a system notice directly into the chat
                    setMessages(prev => [...prev, { id: 'sys-secure-' + Date.now(), text: "🔒 This chat is now secured with End-to-End Encryption. Nobody, not even the server, can read your messages.", sender: 'me', timestamp: new Date() }]);
                } catch (e) {
                    console.error('Failed to establish E2E connection', e);
                }
            }
        } else if (data.type === 'typing-indicator' && data.from !== clientId) {
            setIsTyping(data.isTyping);
        } else if (data.type === 'partner-disconnected') {
            setMessages(prev => [...prev, { id: 'sys-end-' + Date.now(), text: "Stranger has disconnected. 👋", sender: 'stranger', timestamp: new Date() }]);
            setTimeout(() => endCurrentChat(), 2000);
        }
    }, [clientId, endCurrentChat]);

    const sendTypingIndicator = useCallback((typing: boolean) => {
        if (sessionId && remotePeerId) publish(`session:${sessionId}`, { type: 'typing-indicator', isTyping: typing, from: clientId });
    }, [sessionId, remotePeerId, clientId, publish]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setInputMessage(e.target.value);
        sendTypingIndicator(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => sendTypingIndicator(false), 1000);
    }, [sendTypingIndicator]);

    const sendMessage = useCallback(async () => {
        const textToPublish = inputMessage.trim();
        if (!textToPublish || !sessionId || !remotePeerId) return;
        setMessages(prev => [...prev, { id: Date.now().toString(), text: textToPublish, sender: 'me', timestamp: new Date() }]);
        setInputMessage(""); sendTypingIndicator(false);

        let publishPayload: any = { type: 'text-message', text: textToPublish, from: clientId, to: remotePeerId };

        // 🔒 Encrypt the message text specifically, discarding plaintext if secure
        if (isSecure && sharedSecretRef.current) {
            try {
                const encrypted = await encryptMessage(sharedSecretRef.current, textToPublish);
                publishPayload = {
                    type: 'text-message',
                    encrypted: true,
                    iv: encrypted.iv,
                    encryptedData: encrypted.data,
                    from: clientId,
                    to: remotePeerId
                };
            } catch (e) {
                console.error("Encryption failed, falling back to plaintext or aborting", e);
                return;
            }
        }

        publish(`session_${sessionId}`, publishPayload);
    }, [inputMessage, sessionId, remotePeerId, clientId, publish, sendTypingIndicator, isSecure]);

    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    }, [sendMessage]);

    const skipToNext = useCallback(() => { endCurrentChat(); setTimeout(() => startTextChat(), 500); }, [endCurrentChat, startTextChat]);

    const reportUser = useCallback(async () => {
        if (!remotePeerId) return;
        try {
            const r = await fetch('/api/matching/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reportedUserId: remotePeerId, reporterId: clientId }) });
            setReportStatus(await r.json());
            setTimeout(() => setReportStatus(null), 4000);
        } catch { console.error('Error reporting user'); }
    }, [remotePeerId, clientId]);

    const quickEmojis = ['👋', '😊', '😂', '❤️', '👍', '🎉', '🔥', '✨'];
    const addEmoji = useCallback((emoji: string) => { setInputMessage(prev => prev + emoji); inputRef.current?.focus(); }, []);

    useEffect(() => {
        if (!isConnected || !clientId) return;
        const unsub = subscribe(`user_${clientId}`, (data: any) => handleMatchFound(data));
        return () => unsub();
    }, [isConnected, clientId, subscribe, handleMatchFound]);

    useEffect(() => {
        if (!sessionId || !isConnected) return;
        const unsub = subscribe(`session:${sessionId}`, (data: any) => handleIncomingMessage(data));
        return () => unsub();
    }, [sessionId, isConnected, subscribe, handleIncomingMessage]);

    useEffect(() => { return () => { if (isConnectedToPartner || isSearching) endCurrentChat(); }; }, []);

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
            {/* Background blobs */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-indigo-300/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-1/3 -right-40 w-[400px] h-[400px] bg-purple-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute -bottom-40 left-1/3 w-[400px] h-[400px] bg-pink-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
            </div>

            {reportStatus && (
                <div className="absolute top-20 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                    <Alert className={(reportStatus as any).banned ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}>
                        <AlertDescription className={(reportStatus as any).banned ? 'text-red-800' : 'text-emerald-800'}>
                            {reportStatus.message}
                        </AlertDescription>
                    </Alert>
                </div>
            )}

            {/* Header */}
            <header className="relative z-20 flex-shrink-0">
                <div className="absolute inset-0 bg-white/50 backdrop-blur-xl border-b border-white/30 shadow-sm" />
                <div className="max-w-7xl mx-auto px-6 h-16 relative flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 group">
                        <Logo size="md" />
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-2 bg-slate-100 px-2.5 py-1 rounded-full hidden sm:inline-block border border-slate-200">Text Chat</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        {isConnectedToPartner && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                                <span className="text-xs font-semibold text-emerald-700">Connected</span>
                            </div>
                        )}
                        <Link href="/" className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-indigo-600 font-semibold transition-colors">
                            <ArrowLeft className="h-4 w-4" /> Home
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 p-4 relative z-10">
                <div className="flex-1 flex items-center justify-center w-full">
                    {/* Idle */}
                    {!isSearching && !isConnectedToPartner && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-slate-900/40 backdrop-blur-md">
                            <div className="w-full max-w-md">
                                <div className="bg-white backdrop-blur-xl rounded-3xl shadow-2xl shadow-purple-500/20 border border-white/50 p-10 text-center">
                                    <div className="relative mb-8 inline-block">
                                        <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/30 mx-auto">
                                            <MessageSquare className="h-12 w-12 text-white" />
                                        </div>
                                        <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md">
                                            <Sparkles className="h-5 w-5 text-purple-500 animate-pulse" />
                                        </div>
                                    </div>
                                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-600 mb-3">
                                        Text Chat
                                    </h1>
                                    <p className="text-slate-600 mb-8 leading-relaxed">
                                        Chat anonymously with a random stranger — no camera, no mic, just words.
                                    </p>
                                    <button
                                        onClick={startTextChat}
                                        className="w-full py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2"
                                    >
                                        <Sparkles className="h-5 w-5" /> Find a Stranger
                                    </button>
                                    <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
                                        <Shield className="h-3.5 w-3.5 text-emerald-500" />
                                        Anonymous · No sign-up · Free
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Searching */}
                    {isSearching && (
                        <div className="w-full max-w-md">
                            <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl shadow-purple-500/10 border border-white/50 p-10 text-center">
                                <div className="relative mb-8 inline-block">
                                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/30 mx-auto">
                                        <Loader2 className="h-12 w-12 text-white animate-spin" />
                                    </div>
                                    <div className="absolute inset-0 rounded-full bg-purple-400/20 animate-ping mx-auto" style={{ width: '96px', height: '96px', left: 'calc(50% - 48px)' }} />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800 mb-2">Finding your match...</h2>
                                <p className="text-slate-500 mb-8 text-sm">Scanning for someone awesome to chat with</p>
                                <button
                                    onClick={endCurrentChat}
                                    className="px-8 py-3 rounded-xl border-2 border-indigo-200 text-indigo-700 font-semibold hover:bg-indigo-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Chat */}
                    {isConnectedToPartner && (
                        <div className="w-full max-w-3xl h-[calc(100vh-7rem)] bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-purple-500/10 border border-white/50 flex flex-col overflow-hidden">

                            {/* Chat header */}
                            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100/80 bg-white/60">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-sm">
                                        <span className="text-white text-sm font-bold">?</span>
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                            Anonymous Stranger
                                            {isSecure && <span title="End-to-End Encrypted"><ShieldCheck className="h-4 w-4 text-emerald-500" /></span>}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            {isSecure ? <span className="text-emerald-600 font-medium">End-to-end Encrypted 🔒</span> : 'Establishing encryption...'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={reportUser} className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 flex items-center justify-center transition-colors" title="Report">
                                        <Flag className="h-4 w-4" />
                                    </button>
                                    <button onClick={skipToNext} className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-500 hover:text-indigo-500 flex items-center justify-center transition-colors" title="Next partner">
                                        <SkipForward className="h-4 w-4" />
                                    </button>
                                    <button onClick={endCurrentChat} className="h-8 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center gap-1 text-xs font-semibold transition-colors" title="End chat">
                                        <PhoneOff className="h-3.5 w-3.5" /> End
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'} group`}>
                                        <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm transition-shadow hover:shadow-md ${msg.sender === 'me'
                                            ? 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white rounded-br-sm'
                                            : 'bg-white/90 border border-slate-100 text-slate-800 rounded-bl-sm'
                                            }`}>
                                            <p className="text-xs font-semibold mb-1 opacity-70">{msg.sender === 'me' ? 'You' : 'Stranger'}</p>
                                            <p className="text-sm leading-relaxed break-words">{msg.text}</p>
                                            <p className={`text-[10px] mt-1.5 opacity-0 group-hover:opacity-60 transition-opacity ${msg.sender === 'me' ? 'text-white text-right' : 'text-slate-500'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                {/* Typing indicator */}
                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="bg-white/90 border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input area */}
                            <div className="border-t border-slate-100/80 p-4 bg-white/60 backdrop-blur-sm">
                                {/* Quick emojis */}
                                <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
                                    {quickEmojis.map((emoji) => (
                                        <button key={emoji} onClick={() => addEmoji(emoji)}
                                            className="text-xl hover:scale-125 transition-transform bg-white/70 hover:bg-white border border-slate-200 hover:border-indigo-200 rounded-xl p-2 flex-shrink-0 shadow-sm hover:shadow-md"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={inputMessage}
                                        onChange={handleInputChange}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Type a message..."
                                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent bg-white/80 text-sm shadow-sm"
                                    />
                                    <button
                                        onClick={sendMessage}
                                        disabled={!inputMessage.trim()}
                                        className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
                                    >
                                        <Send className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Report toast */}
                            {reportStatus && (
                                <div className={`absolute top-20 right-5 px-5 py-3 rounded-xl shadow-2xl font-semibold text-white text-sm ${reportStatus.success ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                    {reportStatus.message || 'Action completed'}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <aside className="hidden lg:flex flex-col gap-4 w-80">
                    {/* Share Card */}
                    <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Share2 className="h-16 w-16" />
                        </div>
                        <h3 className="font-bold text-xl mb-2">Invite Friends</h3>
                        <p className="text-white/80 text-sm mb-6 leading-relaxed">
                            Share WHOBEE with your friends and explore together!
                        </p>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.origin);
                                alert("Link copied to clipboard!");
                            }}
                            className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-md py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all border border-white/10 active:scale-95 shadow-lg"
                        >
                            <Copy className="h-4 w-4" />
                            Copy WHOBEE Link
                        </button>
                    </div>

                    {/* Safety Card */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white shadow-lg shadow-purple-500/5">
                        <div className="flex items-center gap-3 text-slate-800 mb-4">
                            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                <ShieldCheck className="h-6 w-6 text-emerald-500" />
                            </div>
                            <h3 className="font-bold">Community Safe</h3>
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed mb-4">
                            Be respectful to others. We have zero tolerance for harassment or inappropriate behavior.
                        </p>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                            <Heart className="h-3.5 w-3.5 text-pink-500 fill-pink-500" />
                            Good Vibes Only
                        </div>
                    </div>
                </aside>
            </main>

            <footer className="relative z-10 text-center p-4 text-xs text-slate-400">
                Powered by WHOBEE · Anonymous · No data stored
            </footer>

            <style jsx global>{`
                .scrollbar-none::-webkit-scrollbar { display: none; }
                .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div >
    );
};

export default TextChatPage;
