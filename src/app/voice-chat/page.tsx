// MIGRATED FROM SOCKET.IO TO CENTRIFUGO
// Original file backed up in socket-io-backup/src/app/voice-chat/page.tsx
// Migration date: 2026-02-03T17:33:59.984Z

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useCentrifugo } from '@/context/CentrifugoProvider';
import peer from "@/service/peer";
import { Mic, MicOff, PhoneOff, SkipForward, Video, ArrowLeft, Sparkles, Shield, Share2, Copy, ShieldCheck, Heart, Flag, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import confetti from 'canvas-confetti';
import Logo from '@/components/Logo';
import { Alert, AlertDescription } from "@/components/ui/alert";
import "@/app/globals.css";

interface VoiceMatchFound {
  sessionId: string;
  partnerId: string;
}

interface OfferData {
  from: string;
  offer: RTCSessionDescriptionInit;
}

interface AnswerData {
  from: string;
  answer: RTCSessionDescriptionInit;
}

interface IceData {
  from: string;
  candidate: RTCIceCandidateInit;
}

const VoiceChatPage = () => {
  const {
    clientId, subscribe, publish, isConnected,
    findVoiceMatch, cancelVoiceMatch,
  } = useCentrifugo();

  const [remoteClientId, setRemoteClientId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [connected, setConnected] = useState(false);
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [reportStatus, setReportStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);

  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const sessionSubscriptionRef = useRef<(() => void) | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Call duration timer
  useEffect(() => {
    if (connected) {
      timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
      // Trigger celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#a855f7', '#ec4899']
      });
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCallDuration(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [connected]);

  const formatDuration = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  useEffect(() => {
    if (!peer.peer) return;
    peer.peer.ontrack = (ev) => { const [stream] = ev.streams; setRemoteStream(stream); };
    peer.peer.onicecandidate = (ev) => {
      if (ev.candidate && sessionId) {
        publish(`session:${sessionId}`, { type: 'ice-candidate', from: clientId, candidate: ev.candidate });
      }
    };
  }, [sessionId, clientId, publish]);

  const startVoiceChat = useCallback(async () => {
    if (!isConnected) { alert("Not connected to server. Please wait..."); return; }
    setSearching(true); setConnected(false); setRemoteClientId(null);
    setRemoteStream(null); setSessionId(null);
    peer.resetConnection();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMyStream(stream);
      stream.getTracks().forEach((track) => peer.peer?.addTrack(track, stream));
      await findVoiceMatch();
    } catch (err) {
      console.error("Error accessing microphone or joining queue", err);
      setSearching(false);
    }
  }, [isConnected, findVoiceMatch]);

  const processPendingIceCandidates = useCallback(async () => {
    if (!peer.peer || pendingIceCandidatesRef.current.length === 0) return;
    const candidates = [...pendingIceCandidatesRef.current];
    pendingIceCandidatesRef.current = [];
    for (const candidate of candidates) {
      try { await peer.peer.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) { console.error(e); }
    }
  }, []);

  const reportUser = useCallback(async () => {
    if (!remoteClientId) return;
    try {
      const response = await fetch('/api/matching/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportedUserId: remoteClientId, reporterId: clientId })
      });
      const data = await response.json();
      setReportStatus(data);
      setTimeout(() => setReportStatus(null), 4000);
    } catch { console.error('Error reporting user'); }
  }, [remoteClientId, clientId]);

  const handleVoiceMatchFound = useCallback(async (data: VoiceMatchFound) => {
    setRemoteClientId(data.partnerId); setSessionId(data.sessionId);
    setSearching(false); setConnected(true);
    try {
      const response = await fetch('/api/centrifugo/session-token', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: data.sessionId, userId: clientId })
      });
      await response.json();
      const handleSignaling = (sigData: any) => {
        if (sigData.from === clientId) return;
        switch (sigData.type) {
          case 'offer': handleIncomingCall(sigData, data.sessionId); break;
          case 'answer': handleAnswer(sigData); break;
          case 'ice-candidate': handleIceCandidate(sigData); break;
          case 'partner-disconnected':
          case 'skip':
            skipChat();
            break;
        }
      };
      const unsubscribe = subscribe(`session:${data.sessionId}`, handleSignaling);
      sessionSubscriptionRef.current = unsubscribe;
      if (clientId && data.partnerId && clientId < data.partnerId) {
        setTimeout(async () => {
          try {
            const offer = await peer.getOffer();
            if (offer) await publish(`session:${data.sessionId}`, { type: 'offer', from: clientId, offer });
          } catch (e) { console.error(e); }
        }, 1000);
      }
    } catch (error) { console.error("Failed to get session token:", error); }
  }, [clientId, subscribe, publish]);

  const handleIncomingCall = useCallback(async (data: OfferData, overrideSessionId?: string) => {
    const activeSessionId = overrideSessionId || sessionId;
    if (!peer.peer || !activeSessionId) return;
    const answer = await peer.getAnswer(data.offer);
    await processPendingIceCandidates();
    if (answer && activeSessionId) {
      await publish(`session:${activeSessionId}`, { type: 'answer', from: clientId, answer });
    }
  }, [sessionId, clientId, publish, processPendingIceCandidates]);

  const handleAnswer = useCallback(async (data: AnswerData) => {
    if (!peer.peer) return;
    await peer.peer.setRemoteDescription(new RTCSessionDescription(data.answer));
    await processPendingIceCandidates();
    // Cap bitrate after handshake to reduce encoder buffering latency
    peer.setMaxVideoBitrate(800);
  }, [processPendingIceCandidates]);

  const handleIceCandidate = useCallback(async (data: IceData) => {
    if (!peer.peer) return;
    if (!peer.peer.remoteDescription) { pendingIceCandidatesRef.current.push(data.candidate); return; }
    try { await peer.peer.addIceCandidate(new RTCIceCandidate(data.candidate)); } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (!isConnected || !clientId) return;
    const unsubscribe = subscribe(`user_${clientId}`, (data: any) => {
      if (data.type === 'voice-match-found') handleVoiceMatchFound(data);
    });
    return () => unsubscribe();
  }, [isConnected, clientId, subscribe, handleVoiceMatchFound]);

  const cleanup = () => {
    setConnected(false); setRemoteClientId(null); setRemoteStream(null); setSessionId(null);
    peer.resetConnection();
    if (sessionSubscriptionRef.current) { sessionSubscriptionRef.current(); sessionSubscriptionRef.current = null; }
  };

  const toggleMute = () => {
    if (!myStream) return;
    myStream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setIsAudioEnabled((prev) => !prev);
  };

  const toggleSpeaker = () => {
    if (remoteAudioRef.current) {
        remoteAudioRef.current.muted = !remoteAudioRef.current.muted;
        setIsSpeakerEnabled(!remoteAudioRef.current.muted);
    }
  };

  const skipChat = async () => { 
    if (sessionId) { try { await publish(`session:${sessionId}`, { type: 'skip', from: clientId }); } catch {} }
    await cancelVoiceMatch(); cleanup(); startVoiceChat(); 
  };
  const endChat = async () => {
    if (sessionId) { try { await publish(`session:${sessionId}`, { type: 'partner-disconnected', from: clientId }); } catch {} }
    await cancelVoiceMatch(); cleanup();
    if (myStream) { myStream.getTracks().forEach(track => track.stop()); setMyStream(null); }
  };

  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch(e => console.error("Audio play failed", e));
    }
  }, [remoteStream]);

  // Sound wave bars for visual "active" feel
  const SoundWave = ({ active }: { active: boolean }) => (
    <div className="flex items-end gap-1 h-10">
      {[3, 6, 9, 5, 8, 4, 7, 3, 6].map((h, i) => (
        <div
          key={i}
          className={`w-1.5 rounded-full bg-gradient-to-t from-indigo-500 to-purple-400 transition-all duration-300 ${active ? 'animate-pulse' : 'opacity-30'}`}
          style={{ height: `${active ? h * 4 : 8}px`, animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-indigo-300/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-40 w-[400px] h-[400px] bg-purple-300/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-40 left-1/3 w-[400px] h-[400px] bg-pink-300/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
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
      <header className="relative z-10">
        <div className="absolute inset-0 bg-white/50 backdrop-blur-xl border-b border-white/30 shadow-sm" />
        <div className="max-w-7xl mx-auto px-6 h-16 relative flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <Logo size="md" />
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-2 bg-slate-100 px-2.5 py-1 rounded-full hidden sm:inline-block border border-slate-200">Voice Chat</span>
          </Link>
          <div className="flex items-center gap-3">
            {connected && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>
            )}
            <Link href="/" className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-indigo-600 font-semibold transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 p-6 relative z-10">
        <div className="w-full max-w-md">

          {/* Idle state */}
          {!connected && !searching && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-slate-900/40 backdrop-blur-md">
              <div className="w-full max-w-md">
                <div className="bg-white backdrop-blur-xl rounded-3xl shadow-2xl shadow-purple-500/20 border border-white/50 p-10 text-center">
                  <div className="relative mb-8 inline-block">
                    <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/30 mx-auto">
                      <Mic className="h-12 w-12 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md">
                      <Sparkles className="h-5 w-5 text-purple-500 animate-pulse" />
                    </div>
                  </div>
                  <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-600 mb-3">
                    Voice Chat
                  </h1>
                  <p className="text-slate-600 mb-8 leading-relaxed">
                    Connect voice-only with a random stranger. No camera needed — just your voice.
                  </p>
                  <button
                    onClick={startVoiceChat}
                    className="w-full py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Mic className="h-5 w-5" /> Start Voice Chat
                  </button>
                  <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
                    <Shield className="h-3.5 w-3.5 text-emerald-500" />
                    Anonymous · No sign-up · Free
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Searching state */}
          {searching && (
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl shadow-purple-500/10 border border-white/50 p-10 text-center">
              <div className="relative mb-8 inline-block">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/30 mx-auto">
                  <Mic className="h-10 w-10 text-white animate-pulse" />
                </div>
                <div className="absolute inset-0 rounded-full bg-purple-400/30 animate-ping" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Finding your match...</h2>
              <p className="text-slate-500 mb-8 text-sm">Scanning for a voice partner nearby</p>
              <div className="flex justify-center mb-8">
                <SoundWave active={true} />
              </div>
              <button
                onClick={endChat}
                className="px-8 py-3 rounded-xl border-2 border-indigo-200 text-indigo-700 font-semibold hover:bg-indigo-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Connected state */}
          {connected && (
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl shadow-purple-500/10 border border-white/50 p-10 text-center">
              <audio ref={remoteAudioRef} autoPlay playsInline />

              {/* Avatar with pulse rings */}
              <div className="relative mb-6 inline-block">
                <div className="absolute inset-0 rounded-full bg-indigo-400/20 animate-ping scale-110" />
                <div className="absolute inset-0 rounded-full bg-purple-400/10 animate-ping scale-125" style={{ animationDelay: '0.5s' }} />
                <div className="relative h-28 w-28 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/40 mx-auto">
                  <span className="text-5xl">🔊</span>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-8 h-8 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              </div>

              <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Connected!</h2>
              <p className="text-slate-500 text-sm mb-2">Say hello to your partner</p>
              <div className="text-indigo-600 font-mono font-bold text-lg mb-6">{formatDuration(callDuration)}</div>

              {/* Sound wave visual */}
              <div className="flex justify-center mb-8">
                <SoundWave active={!!(remoteStream)} />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-5">
                <button
                  onClick={toggleMute}
                  className={`h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${!isAudioEnabled ? 'bg-red-500 text-white shadow-red-500/30' : 'bg-white border border-slate-200 text-slate-700 shadow-slate-200'}`}
                  title={isAudioEnabled ? "Mute" : "Unmute"}
                >
                  {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
                </button>

                <button
                  onClick={toggleSpeaker}
                  className={`h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${!isSpeakerEnabled ? 'bg-red-500 text-white shadow-red-500/30' : 'bg-white border border-slate-200 text-slate-700 shadow-slate-200'}`}
                  title={isSpeakerEnabled ? "Speaker Off" : "Speaker On"}
                >
                  {isSpeakerEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
                </button>

                <button
                  onClick={endChat}
                  className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-xl shadow-red-500/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                  title="End call"
                >
                  <PhoneOff className="h-7 w-7" />
                </button>

                <button
                  onClick={reportUser}
                  className="h-14 w-14 rounded-full bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                  title="Report User"
                >
                  <Flag className="h-6 w-6" />
                </button>

                <button
                  onClick={skipChat}
                  className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                  title="Next partner"
                >
                  <SkipForward className="h-6 w-6" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SIDE PANEL EXTRAS: SHARE & SAFETY */}
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
        Powered by WHOBEE · WebRTC P2P · No data stored
      </footer>
    </div>
  );
};

export default VoiceChatPage;
