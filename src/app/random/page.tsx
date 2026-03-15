"use client";

import React, { useEffect, useCallback, useState, useRef } from "react";
import Link from "next/link";
import ReactPlayer from "react-player";
import peer from "@/service/peer";
import { useCentrifugo } from "@/context/CentrifugoProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Chat as Chatbox } from "@/components/public-room/chat";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Video,
    Phone,
    PhoneOff,
    Mic,
    MicOff,
    Video as VideoIcon,
    VideoOff,
    SkipForward,
    Users,
    MessageSquare,
    Flag,
    AlertTriangle,
    MessageCircle,
    LayoutPanelLeft,
    LayoutPanelTop,
    Settings,
    Eye,
    EyeOff,
    Send,
    Share2,
    Copy,
    ShieldCheck,
    Heart,
    Camera,
    HelpCircle,
    X,
    Sparkles
} from "lucide-react";
import confetti from 'canvas-confetti';
import { Alert, AlertDescription } from "@/components/ui/alert";
import Logo from '@/components/Logo';
import { useRouter } from "next/navigation";
import { ConnectionPopup } from "@/components/ui/connection-popup";
import { useVideoProcessor } from "@/hooks/useVideoProcessor";
import { usePostHog } from 'posthog-js/react';
import { useReactionRecorder } from "@/hooks/useReactionRecorder";

import "@/app/globals.css";
import FeedbackButton from "@/components/ui/FeedbackButton";

const honeycombBackground = {
    backgroundImage: `
    radial-gradient(circle at 100px 100px, rgba(59, 130, 246, 0.1) 2%, transparent 2%),
    radial-gradient(circle at 200px 200px, rgba(59, 130, 246, 0.1) 2%, transparent 2%),
    radial-gradient(circle at 300px 100px, rgba(59, 130, 246, 0.1) 2%, transparent 2%),
    radial-gradient(circle at 400px 200px, rgba(59, 130, 246, 0.1) 2%, transparent 2%)
  `,
    backgroundSize: '100px 100px',
    backgroundPosition: '0 0, 50px 50px, 50px 0, 0 50px, 25px 25px',
    backgroundColor: 'rgb(239 246 255)'
};

interface MatchFoundData {
    partnerId: string;
}

interface CallData {
    from: string;
    offer: RTCSessionDescriptionInit;
}

interface CallAcceptedData {
    from: string;
    ans: RTCSessionDescriptionInit;
}

interface NegoData {
    from: string;
    offer: RTCSessionDescriptionInit;
}

interface NegoFinalData {
    ans: RTCSessionDescriptionInit;
}

type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'failed';

const RandomChatPage = () => {
    const { clientId, isConnected, subscribe, publish } = useCentrifugo();
    const router = useRouter();
    const [remotePeerId, setRemotePeerId] = useState<string | null>(null);
    const [myStream, setMyStream] = useState<MediaStream>();
    const [remoteStream, setRemoteStream] = useState<MediaStream>();
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [isConnectedToPartner, setIsConnectedToPartner] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
    const [callStarted, setCallStarted] = useState(false);
    const [reportStatus, setReportStatus] = useState<{ success?: boolean; message?: string } | null>(null);
    const [banStatus, setBanStatus] = useState<{ permanent?: boolean; remainingTime?: number; message?: string } | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [layout, setLayout] = useState<'horizontal' | 'vertical'>('horizontal');
    const [matchChannel, setMatchChannel] = useState<string | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);

    // Preferences state
    const [showPreferences, setShowPreferences] = useState(false);
    const [gender, setGender] = useState<"male" | "female" | "other">("other");
    const [lookingFor, setLookingFor] = useState<"male" | "female" | "any">("any");
    const [interests, setInterests] = useState<string[]>([]);
    const [region, setRegion] = useState<string | undefined>();
    const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);

    const posthog = usePostHog();

    // Blur Chat State
    const [blurAmount, setBlurAmount] = useState(100); // Start at max blur (100)
    const [myRevealRequested, setMyRevealRequested] = useState(false);
    const [partnerRevealRequested, setPartnerRevealRequested] = useState(false);
    const [isRevealed, setIsRevealed] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const blurTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [rawStream, setRawStream] = useState<MediaStream | null>(null);

    // Snapshot Functionality

    // Reaction Settings State
    const [isReactionSettingsOpen, setIsReactionSettingsOpen] = useState(false);
    const [preRevealTime, setPreRevealTime] = useState(2); // seconds
    const [postRevealTime, setPostRevealTime] = useState(5); // seconds
    const takeSnapshot = useCallback((videoElement: HTMLVideoElement | null, isLocal: boolean = false) => {
        if (!videoElement) return;

        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw video frame
        if (isLocal) {
            ctx.scale(-1, 1); // Mirror for local
            ctx.drawImage(videoElement, -canvas.width, 0, canvas.width, canvas.height);
            ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
        } else {
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        }

        // Add Watermark / Branding
        const gradient = ctx.createLinearGradient(20, canvas.height - 60, 200, canvas.height - 60);
        gradient.addColorStop(0, '#a855f7'); // Purple
        gradient.addColorStop(1, '#ec4899'); // Pink

        ctx.font = 'bold 32px sans-serif';
        ctx.fillStyle = gradient;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.fillText('WHOBEE', 30, canvas.height - 40);

        ctx.font = '16px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText('Met a stranger on whobee.com', 30, canvas.height - 20);

        // Download
        const link = document.createElement('a');
        link.download = `whobee-snapshot-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }, []);

    // Watermark Component
    const VideoWatermark = () => (
        <div className="absolute bottom-4 left-4 z-20 pointer-events-none opacity-50 hover:opacity-100 transition-opacity">
            <div className="flex flex-col items-start">
                <span className="text-white font-bold text-lg leading-none tracking-tight drop-shadow-md">
                    WHOBEE
                </span>
                <span className="text-white/70 text-[10px] uppercase tracking-wider font-medium drop-shadow-sm">
                    Live Video
                </span>
            </div>
        </div>
    );
    const rawStreamRef = useRef<MediaStream | null>(null);

    // Use the custom hook for video processing
    const { processedStream, setBlurLevel } = useVideoProcessor(rawStream);

    // Use the custom hook for viral reaction recording
    const {
        isRecording,
        recordedVideoUrl,
        startRecording,
        stopRecording,
        triggerRevealInRecording,
        shareVideo,
        downloadVideo,
        clearRecording
    } = useReactionRecorder(rawStream, remoteStream || null);

    // Predefined interest options
    const interestOptions = [
        "Music", "Sports", "Gaming", "Movies", "Technology",
        "Travel", "Food", "Art", "Books", "Fitness",
        "Fashion", "Photography", "Coding", "Anime"
    ];

    const channel = 'random_matching';

    // Attach streams to HTML video immediately upon stream change or UI remount
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            console.log("Attaching remote stream to video element.");
            remoteVideoRef.current.srcObject = remoteStream;
        } else if (remoteVideoRef.current && !remoteStream) {
            remoteVideoRef.current.srcObject = null;
        }
    }, [remoteStream, isConnectedToPartner]);

    // Load preferences from localStorage on mount
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

        const savedSettings = localStorage.getItem('reactionSettings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                if (typeof settings.preRevealTime === 'number') setPreRevealTime(settings.preRevealTime);
                if (typeof settings.postRevealTime === 'number') setPostRevealTime(settings.postRevealTime);
            } catch (err) {
                console.error('Failed to parse reaction settings:', err);
            }
        }

        setIsLoadingPrefs(false);
    }, []);

    // Save reaction settings to localStorage when they change
    useEffect(() => {
        if (!isLoadingPrefs) {
            localStorage.setItem('reactionSettings', JSON.stringify({
                preRevealTime,
                postRevealTime
            }));
        }
    }, [preRevealTime, postRevealTime, isLoadingPrefs]);

    // NOTE: Removed auto-start logic. User must click "Start Chat" or similar if we want a manual trigger, 
    // OR we can auto-start if they came from lobby. For now, we will keep the "Start Random Video Chat" button 
    // but remove the "Preferences" toggle since that's now in the lobby.

    // Actually, looking at the UI code below (lines 908+), we need to update that to remove the Preferences button 
    // and maybe just have a "Start" button that uses the loaded prefs, or a "Back to Lobby" button.

    // Preferences are now managed solely by the Lobby.
    // We only read them here.
    // (Writing useEffect removed to prevent overwriting with defaults on mount)

    // Region detection removed due to CORS/rate-limiting issues
    // Users can be matched based on other preferences

    useEffect(() => {
        if (localVideoRef.current && rawStream) {
            // Use rawStream (unblurred) for local preview
            localVideoRef.current.srcObject = rawStream;
        }
    }, [rawStream]);

    const toggleChat = useCallback(() => {
        setIsChatOpen(prev => {
            if (!prev) setUnreadCount(0);
            return !prev;
        });
    }, []);

    const toggleLayout = useCallback(() => {
        setLayout(prev => (prev === 'horizontal' ? 'vertical' : 'horizontal'));
    }, []);

    // Blur Timer Logic
    // Phased Blur Logic
    const [chatDuration, setChatDuration] = useState(0);

    useEffect(() => {
        if (isConnectedToPartner && !isRevealed) {
            // Reset duration on new chat
            // Note: This effect runs when connection changes, but we might want to reset explicitly in startRandomChat

            // Start timer
            blurTimerRef.current = setInterval(() => {
                setChatDuration(prev => {
                    const newDuration = prev + 1;

                    // Phase Logic
                    let targetBlur = 100;

                    if (newDuration < 60) {
                        // Phase 1: 0-60s -> High Blur (100% down to 90% maybe? or just stick to 100?)
                        // User said: "Phase 1... 100% Blur"
                        targetBlur = 100;
                    } else if (newDuration < 180) {
                        // Phase 2: 60s-180s -> Reduce to 50%
                        // Linear interpolation from 100 to 50 over 120 seconds
                        const progress = (newDuration - 60) / 120; // 0 to 1
                        targetBlur = 100 - (progress * 50); // 100 -> 50
                    } else {
                        // Phase 3: 180s+ -> Hold 50%
                        targetBlur = 50;
                    }

                    // Apply blur
                    setBlurAmount(Math.round(targetBlur));
                    setBlurLevel(Math.round(targetBlur));

                    return newDuration;
                });
            }, 1000);
        }

        return () => {
            if (blurTimerRef.current) {
                clearInterval(blurTimerRef.current);
            }
        };
    }, [isConnectedToPartner, isRevealed, setBlurLevel]);

    const handleRequestReveal = useCallback(() => {
        if (!matchChannel || !isConnected) return;

        setMyRevealRequested(true);
        publish(matchChannel, {
            type: 'request-reveal',
            from: clientId,
            to: remotePeerId
        });

        // Check mutual reveal
        if (partnerRevealRequested) {
            handleMutualReveal();
        }
    }, [matchChannel, isConnected, clientId, remotePeerId, partnerRevealRequested, publish]);

    const handleMutualReveal = useCallback(() => {
        // Start recording anticipation
        startRecording();
        console.log(`Started Reaction Recorder. Waiting ${preRevealTime}s before reveal.`);

        setTimeout(() => {
            setIsRevealed(true);
            setBlurAmount(0);
            setBlurLevel(0);
            if (blurTimerRef.current) clearInterval(blurTimerRef.current);
            console.log("Mutual reveal activated!");

            // Tell the recorder to drop the canvas blur
            triggerRevealInRecording();

            // Celebration!
            confetti({
                particleCount: 200,
                spread: 100,
                origin: { y: 0.6 },
                colors: ['#a855f7', '#ec4899', '#3b82f6'],
                zIndex: 9999
            });

            // Fire a second burst for extra effect
            setTimeout(() => {
                confetti({
                    particleCount: 100,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#a855f7', '#ec4899', '#3b82f6'],
                    zIndex: 9999
                });
                confetti({
                    particleCount: 100,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#a855f7', '#ec4899', '#3b82f6'],
                    zIndex: 9999
                });
            }, 250);

            // Stop recording after dynamic post-reveal reaction duration
            setTimeout(() => {
                stopRecording();
                console.log(`Stopped Reaction Recorder after ${postRevealTime}s of reaction.`);
            }, postRevealTime * 1000);

        }, Math.max(preRevealTime * 1000, 100)); // Ensure at least 100ms
    }, [setBlurLevel, startRecording, triggerRevealInRecording, stopRecording, preRevealTime, postRevealTime]);

    const renderControlButtons = (context: 'floating' | 'chat') => {
        const baseCircle = 'h-10 w-10 flex items-center justify-center rounded-full transition-colors shadow-sm';
        const micButton = `${baseCircle} ${isAudioEnabled ? 'bg-white hover:bg-gray-100 text-gray-700' : 'bg-red-500 text-white hover:bg-red-600'}`;
        const videoButton = `${baseCircle} ${isVideoEnabled ? 'bg-white hover:bg-gray-100 text-gray-700' : 'bg-red-500 text-white hover:bg-red-600'}`;
        const baseChatButton = 'flex items-center gap-2 h-10 rounded-full font-medium shadow-sm transition-colors px-4';
        const nextButton = `${baseChatButton} bg-blue-500 text-white hover:bg-blue-600`;
        const reportButton = `${baseChatButton} bg-white hover:bg-gray-100 text-gray-700`;
        const endButton = `${baseChatButton} bg-white hover:bg-red-50 text-red-500`;
        const containerClasses = context === 'floating'
            ? 'bg-white rounded-full shadow-lg px-4 py-3 justify-center'
            : 'bg-white rounded-md border-t border-gray-100 px-2 py-3 justify-center';

        const revealButton = `${baseChatButton} ${myRevealRequested ? 'bg-pink-100 text-pink-600' : 'bg-pink-500 text-white hover:bg-pink-600'}`;


        if (context === 'floating') {
            return (
                <div className={`flex items-center gap-2 rounded-lg ${containerClasses} overflow-x-auto no-scrollbar`}>
                    {!isRevealed && isConnectedToPartner && (
                        <button
                            onClick={handleRequestReveal}
                            className={`${baseCircle} ${(chatDuration >= 180 || partnerRevealRequested)
                                ? 'bg-pink-500 text-white hover:bg-pink-600 animate-pulse ring-2 ring-offset-2 ring-pink-400'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                                }`}
                            disabled={myRevealRequested || (chatDuration < 180 && !partnerRevealRequested)}
                            aria-label={myRevealRequested ? "Waiting for partner..." : "Request to unblur"}
                        >
                            {myRevealRequested ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                        </button>
                    )}
                    <button onClick={toggleAudio} className={micButton} aria-label={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}>
                        {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                    </button>
                    <button onClick={toggleVideo} className={videoButton} aria-label={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}>
                        {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                    </button>
                    <button onClick={skipToNext} className={`${baseCircle} bg-blue-500 text-white hover:bg-blue-600 shadow-md ${!remotePeerId ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={!remotePeerId} aria-label="Next partner">
                        <SkipForward className="h-5 w-5" />
                    </button>
                    <button onClick={reportUser} className={`${baseCircle} bg-white hover:bg-gray-100 text-gray-700`} title="Report inappropriate behavior" >
                        <Flag className="h-5 w-5" />
                    </button>
                    <button onClick={endCurrentChat} className={`${baseCircle} bg-white hover:bg-red-50 text-red-500`} aria-label="End call">
                        <PhoneOff className="h-5 w-5" />
                    </button>
                    <button onClick={toggleChat} className={`${baseCircle} bg-purple-500 text-white hover:bg-purple-600 shadow-md relative`} aria-label="Open chat">
                        <MessageSquare className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                </div>
            );
        }

        return (
            <div className={`flex items-center gap-2 flex-wrap ${containerClasses}`}>
                {!isRevealed && isConnectedToPartner && (
                    <button
                        onClick={handleRequestReveal}
                        className={`${revealButton} ${(chatDuration >= 180 || partnerRevealRequested)
                            ? 'opacity-100 animate-pulse ring-2 ring-offset-2 ring-pink-400'
                            : 'opacity-50 grayscale'
                            }`}
                        disabled={myRevealRequested || (chatDuration < 180 && !partnerRevealRequested)}
                        title={
                            myRevealRequested ? "Waiting for partner..." :
                                (chatDuration < 180 && !partnerRevealRequested) ? "Reveal available in Phase 3 (3 mins)" :
                                    "Request to unblur"
                        }
                    >
                        {myRevealRequested ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                        <span>{myRevealRequested ? "Requested" : "RevealRequest"}</span>
                    </button>
                )}

                <button onClick={toggleAudio} className={micButton} aria-label={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}>
                    {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </button>
                <button onClick={toggleVideo} className={videoButton} aria-label={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}>
                    {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </button>
                <button onClick={skipToNext} className={`${nextButton} ${!remotePeerId ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={!remotePeerId} aria-label="Next partner">
                    <SkipForward className="h-5 w-5" />

                </button>
                <button onClick={reportUser} className={reportButton} title="Report inappropriate behavior" aria-label="Report user">
                    <Flag className="h-5 w-5" />
                </button>
                <button onClick={endCurrentChat} className={endButton} aria-label="End call">
                    <PhoneOff className="h-5 w-5" />
                </button>
            </div>
        );
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mq = window.matchMedia('(min-width: 1024px)');
        const update = (e: MediaQueryList | MediaQueryListEvent) => {
            if ('matches' in e ? e.matches : (e as MediaQueryList).matches) {
                setIsChatOpen(true);
            } else {
                setIsChatOpen(false);
            }
        };
        update(mq);
        if (mq.addEventListener) {
            mq.addEventListener('change', update);
            return () => mq.removeEventListener('change', update);
        } else if ((mq as any).addListener) {
            (mq as any).addListener(update);
            return () => (mq as any).removeListener(update);
        }
    }, []);



    const toggleInterest = useCallback((interest: string) => {
        setInterests(prev =>
            prev.includes(interest)
                ? prev.filter(i => i !== interest)
                : [...prev, interest]
        );
    }, []);

    const myStreamRef = useRef<MediaStream | undefined>(undefined);
    const remoteStreamRef = useRef<MediaStream | undefined>(undefined);

    // Inject Processed Stream into PeerConnection and MyStream state
    useEffect(() => {
        if (processedStream) {
            setMyStream(processedStream);

            if (peer.peer) {
                const videoTrack = processedStream.getVideoTracks()[0];
                const senders = peer.peer.getSenders();
                const videoSender = senders.find(s => s.track?.kind === 'video');

                if (videoSender) {
                    videoSender.replaceTrack(videoTrack).catch(err => console.error("Error replacing track:", err));
                } else {
                    // If no sender yet, we rely on the handleMatchFound logic to add tracks from myStream
                    // But we should ensure myStream is up to date there.
                }
            }
        }
    }, [processedStream, isConnectedToPartner]);

    // Update refs when state changes
    useEffect(() => {
        if (myStream) myStreamRef.current = myStream;
    }, [myStream]);

    useEffect(() => {
        if (remoteStream) remoteStreamRef.current = remoteStream;
    }, [remoteStream]);

    const handleMatchFound = useCallback(async (data: any) => {
        if (data.type !== 'match_found') return;

        // Determine if we are clientA or clientB
        const isClientA = data.clientA === clientId;
        const isClientB = data.clientB === clientId;

        if (!isClientA && !isClientB) {
            // This match is not for us
            return;
        }

        const partnerId = isClientA ? data.clientB : data.clientA;
        const matchChannel = `random:${data.roomId}`;

        console.log("Match found with:", partnerId, "in channel:", matchChannel);
        setRemotePeerId(partnerId);
        setMatchChannel(matchChannel);
        setIsSearching(false);
        setIsConnectedToPartner(true);

        // Reset Reveal States
        setMyRevealRequested(false);
        setPartnerRevealRequested(false);
        setIsRevealed(false);

        if (!peer.peer) {
            peer.resetConnection();
        }

        if (myStreamRef.current && peer.peer) {
            const tracks = myStreamRef.current.getTracks();
            const senders = peer.peer.getSenders();

            tracks.forEach(track => {
                // Check if this track is already being sent
                const existingSender = senders.find(sender => sender.track === track);
                if (!existingSender) {
                    peer.peer?.addTrack(track, myStreamRef.current!);
                }
            });
        }

        // Set up ICE candidate handler to send candidates via Centrifugo
        peer.setOnIceCandidate((candidate) => {
            if (matchChannel) {
                console.log('Sending ICE candidate to:', partnerId);
                publish(matchChannel, {
                    type: 'ice-candidate',
                    candidate: candidate.toJSON(),
                    from: clientId,
                    to: partnerId
                });
            }
        });

        // Start the call automatically if we're clientA (initiator)
        if (isClientA) {
            setTimeout(async () => {
                try {
                    const offer = await peer.getOffer();
                    if (offer && matchChannel) {
                        console.log("Sending offer to:", partnerId);
                        publish(matchChannel, {
                            type: 'offer',
                            offer,
                            from: clientId,
                            to: partnerId
                        });
                        setCallStarted(true);
                    }
                } catch (error) {
                    console.error("Error creating offer:", error);
                }
            }, 1000);
        }
    }, [clientId, publish]);

    const handleIncomingCall = useCallback(
        async (data: any) => {
            if (data.type !== 'offer' || data.to !== clientId) return;

            console.log(`Incoming Call from random partner`, data.from);

            if (!peer.peer) {
                peer.resetConnection();
            }

            if (myStreamRef.current && peer.peer) {
                const tracks = myStreamRef.current.getTracks();
                const senders = peer.peer.getSenders();

                tracks.forEach(track => {
                    // Check if this track is already being sent
                    const existingSender = senders.find(sender => sender.track === track);
                    if (!existingSender) {
                        peer.peer?.addTrack(track, myStreamRef.current!);
                    }
                });
            }

            try {
                const ans = await peer.getAnswer(data.offer);
                if (ans && matchChannel) {
                    console.log("Sending answer to:", data.from);
                    publish(matchChannel, {
                        type: 'answer',
                        ans,
                        from: clientId,
                        to: data.from
                    });
                    setCallStarted(true);
                }
            } catch (error) {
                console.error("Error creating answer:", error);
            }
        },
        [clientId, matchChannel, publish]
    );

    const handleCallAccepted = useCallback(
        async (data: any) => {
            if (data.type !== 'answer' || data.to !== clientId) return;
            await peer.setLocalDescription(data.ans);
            // Cap bitrate to prevent encoder buffering latency
            peer.setMaxVideoBitrate(800);
            console.log("Random chat call accepted!");

            posthog?.capture('match_found', {
                channel: matchChannel
            });
        },
        [clientId, matchChannel, posthog]
    );

    const handleNegoNeeded = useCallback(async () => {
        try {
            if (peer.peer?.signalingState !== 'stable') {
                console.log('Signaling state not stable, skipping negotiation');
                return;
            }
            const offer = await peer.getOffer();
            if (remotePeerId && offer && matchChannel) {
                publish(matchChannel, {
                    type: 'peer-nego-needed',
                    offer,
                    from: clientId,
                    to: remotePeerId
                });
            }
        } catch (err) {
            console.error('Error during negotiation:', err);
        }
    }, [remotePeerId, clientId, matchChannel, publish]);

    const handleNegoNeedIncoming = useCallback(
        async (data: any) => {
            if (data.type !== 'peer-nego-needed' || data.to !== clientId) return;

            try {
                if (peer.peer?.signalingState !== 'stable') {
                    console.log('Waiting for signaling state to stabilize');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                const ans = await peer.getAnswer(data.offer);
                if (ans && matchChannel) {
                    publish(matchChannel, {
                        type: 'peer-nego-final',
                        ans,
                        from: clientId,
                        to: data.from
                    });
                }
            } catch (err) {
                console.error('Error handling incoming negotiation:', err);
            }
        },
        [clientId, matchChannel, publish]
    );

    const handleNegoNeedFinal = useCallback(async (data: any) => {
        if (data.type !== 'peer-nego-final' || data.to !== clientId) return;
        await peer.setLocalDescription(data.ans);
        peer.setMaxVideoBitrate(800);
    }, [clientId]);

    const handleIceCandidate = useCallback(async (data: any) => {
        if (data.type !== 'ice-candidate' || data.to !== clientId) return;
        console.log('Received ICE candidate from:', data.from);
        await peer.addIceCandidate(data.candidate);
    }, [clientId]);

    const handleIncomingRevealRequest = useCallback((data: any) => {
        if (data.type !== 'request-reveal' || data.to !== clientId) return;
        console.log("Partner requested reveal");
        setPartnerRevealRequested(true);

        // If I already requested, we reveal!
        if (myRevealRequested) {
            handleMutualReveal();
        }
    }, [clientId, myRevealRequested, handleMutualReveal]);



    // Optimized disconnect that keeps local stream alive
    const disconnectPartner = useCallback(() => {
        if (remoteStream) {
            remoteStream.getTracks().forEach(track => {
                track.stop();
                console.log("Stopped remote track", track.kind);
            });
            setRemoteStream(undefined);
        }

        peer.resetConnection();
        setRemotePeerId(null);
        setMatchChannel(null);
        setIsConnectedToPartner(false);
        setCallStarted(false);

        // Reset blur states
        setBlurAmount(100);
        setIsRevealed(false);
        setMyRevealRequested(false);
        setPartnerRevealRequested(false);
        setChatDuration(0);
        if (blurTimerRef.current) clearInterval(blurTimerRef.current);

        if (matchChannel) {
            publish(matchChannel, {
                type: 'end-chat',
                from: clientId
            });
        }
    }, [remoteStream, matchChannel, clientId, publish]);

    const endCurrentChat = useCallback(() => {
        if (myStream) {
            myStream.getTracks().forEach(track => track.stop());
            setMyStream(undefined);
        }
        if (rawStreamRef.current) {
            rawStreamRef.current.getTracks().forEach(track => track.stop());
            rawStreamRef.current = null;
            setRawStream(null);
        }

        disconnectPartner();
        setIsSearching(false);
    }, [myStream, disconnectPartner]);

    const startRandomChat = useCallback(async () => {
        setIsSearching(true);
        setShowPreferences(false);
        try {
            // Only get media if we don't have it already
            if (!rawStreamRef.current) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: { width: 640, height: 480 },
                });
                setRawStream(stream);
                rawStreamRef.current = stream;
            }

            peer.resetConnection();

            // Reset blur logic
            setBlurAmount(100);
            setBlurLevel(100);
            setIsRevealed(false);
            setChatDuration(0);

            // Request matching via HTTP API with preferences
            const response = await fetch('/api/matching/join-random', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId,
                    preferences: {
                        gender,
                        lookingFor,
                        interests,
                        region
                    }
                })
            });

            if (response.status === 403) {
                router.push('/banned');
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to join matching queue');
            }
        } catch (error) {
            console.error("Error starting random chat:", error);
            setIsSearching(false);
            // If error occurred during start, cleanup might be needed
            // But only if we have a stream to clean up
            if (rawStreamRef.current) {
                rawStreamRef.current.getTracks().forEach(track => track.stop());
                rawStreamRef.current = null;
                setRawStream(null);
            }
        }
    }, [clientId, gender, lookingFor, interests, region, setBlurLevel]);

    const skipToNext = useCallback(() => {
        posthog?.capture('chat_skipped', {
            duration_seconds: chatDuration,
            reason: 'clicked_skip',
            is_revealed: isRevealed,
            blur_amount: blurAmount
        });

        setIsSearching(true); // Prevent idle UI flash
        disconnectPartner();
        // Slight delay to ensure peer connection is clean before restarting
        setTimeout(() => {
            startRandomChat();
        }, 100);
    }, [disconnectPartner, startRandomChat, chatDuration, isRevealed, blurAmount, posthog]);

    const handleChatEnd = useCallback((data: any) => {
        if (data.type !== 'end-chat') return;
        if (data.from === clientId) return; // Prevent reacting to our own end-chat event
        
        console.log("Chat ended by partner. Skipping to next...");
        setIsSearching(true); // Prevent idle UI flash
        // Immediately trigger skip logic so the remaining user isn't stuck alone
        disconnectPartner();
        setTimeout(() => {
            startRandomChat();
        }, 100);
    }, [disconnectPartner, startRandomChat, clientId]);

    const toggleAudio = useCallback(() => {
        if (rawStreamRef.current) {
            const audioTrack = rawStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioEnabled(audioTrack.enabled);
            }
        }
    }, []);

    const toggleVideo = useCallback(() => {
        if (rawStreamRef.current) {
            const videoTrack = rawStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoEnabled(videoTrack.enabled);
            }
        }
    }, []);

    // Establish stable WebRTC track bindings
    useEffect(() => {
        peer.setOnTrack((ev: RTCTrackEvent) => {
            const stream = ev.streams[0];
            console.log("GOT TRACKS!!", stream);
            if (stream) {
                setRemoteStream(stream);
            }
        });

        peer.setOnNegotiationNeeded(() => {
            handleNegoNeeded();
        });

        // Set up connection state monitoring
        peer.setOnConnectionStateChange((state) => {
            console.log("Connection state updated:", state);
            if (state === 'connected') setConnectionStatus('connected');
            if (state === 'disconnected') setConnectionStatus('disconnected');
            if (state === 'failed') setConnectionStatus('failed');
            if (state === 'closed') setConnectionStatus('disconnected');
        });

        peer.setOnIceConnectionStateChange((state) => {
            console.log("ICE Connection state updated:", state);
            if (state === 'disconnected' || state === 'failed') setConnectionStatus('reconnecting');
            if (state === 'connected' || state === 'completed') setConnectionStatus('connected');
        });

    }, [handleNegoNeeded]);

    const reportUser = useCallback(async () => {
        if (!remotePeerId) return;

        try {
            const response = await fetch('/api/matching/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportedUserId: remotePeerId, reporterId: clientId })
            });

            const data = await response.json();
            setReportStatus(data);

            setTimeout(() => {
                setReportStatus(null);
            }, 5000);
        } catch (error) {
            console.error('Error reporting user:', error);
        }
    }, [remotePeerId, clientId]);

    // Ref for stable matchmaking handler to avoid dependency chain looping
    const handleMatchFoundRef = useRef(handleMatchFound);
    useEffect(() => { handleMatchFoundRef.current = handleMatchFound; }, [handleMatchFound]);

    // Subscribe to matching channel
    useEffect(() => {
        if (!isConnected) return;

        const unsubscribe = subscribe(channel, (data: any) => {
            console.log('Matching message:', data);
            handleMatchFoundRef.current(data);
        });

        return () => {
            unsubscribe();
        };
    }, [isConnected, channel, subscribe]);

    // Refs for stable call handlers
    const callHandlersRef = useRef({
        handleIncomingCall,
        handleCallAccepted,
        handleNegoNeedIncoming,
        handleNegoNeedFinal,
        handleIceCandidate,
        handleChatEnd,
        handleIncomingRevealRequest
    });

    useEffect(() => {
        callHandlersRef.current = {
            handleIncomingCall,
            handleCallAccepted,
            handleNegoNeedIncoming,
            handleNegoNeedFinal,
            handleIceCandidate,
            handleChatEnd,
            handleIncomingRevealRequest
        };
    }, [handleIncomingCall, handleCallAccepted, handleNegoNeedIncoming, handleNegoNeedFinal, handleIceCandidate, handleChatEnd, handleIncomingRevealRequest]);

    // Subscribe to match channel when assigned
    useEffect(() => {
        if (!matchChannel || !isConnected) return;

        console.log('Subscribing to match channel:', matchChannel);

        const unsubscribe = subscribe(matchChannel, (data: any) => {
            console.log('Match channel message:', data);
            const handlers = callHandlersRef.current;
            handlers.handleIncomingCall(data);
            handlers.handleCallAccepted(data);
            handlers.handleNegoNeedIncoming(data);
            handlers.handleNegoNeedFinal(data);
            handlers.handleIceCandidate(data);
            handlers.handleChatEnd(data);
            handlers.handleIncomingRevealRequest(data);
        });

        return () => {
            unsubscribe();
        };
    }, [matchChannel, isConnected, subscribe]);

    useEffect(() => {
        return () => {
            endCurrentChat();
        };
    }, []);

    // Polling interval for matchmaking to trigger timeouts if stuck
    useEffect(() => {
        let pollInterval: NodeJS.Timeout;

        if (isSearching && !remoteStream) {
            pollInterval = setInterval(async () => {
                try {
                    console.log("Polling matchmaking queue...");
                    const response = await fetch('/api/matching/join-random', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            clientId,
                            preferences: {
                                gender,
                                lookingFor,
                                interests,
                                region
                            }
                        })
                    });

                    if (response.status === 403) {
                        router.push('/banned');
                        return;
                    }
                } catch (error) {
                    console.error("Error polling matching queue:", error);
                }
            }, 3000);
        }

        return () => {
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [isSearching, remoteStream, clientId, gender, lookingFor, interests, region, router]);

    // Chat state
    const [messages, setMessages] = useState<any[]>([]);

    // Subscribe to chat messages
    useEffect(() => {
        if (!matchChannel || !isConnected) return;

        const handleMessage = (data: any) => {
            if (data.type === 'chat-message' && data.from !== clientId) {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    text: data.text,
                    sender: 'Stranger',
                    senderId: 'stranger',
                    timestamp: new Date(),
                    type: 'text'
                }]);

                // Add unread badge if chat is not open
                setIsChatOpen(currentIsOpen => {
                    if (!currentIsOpen) {
                        setUnreadCount(prev => prev + 1);
                    }
                    return currentIsOpen;
                });
            }
        };

        const unsubscribe = subscribe(matchChannel, handleMessage);

        return () => {
            unsubscribe();
        };
    }, [matchChannel, clientId, isConnected, subscribe]);

    const handleSendMessage = useCallback((text: string) => {
        if (!text.trim() || !remotePeerId || !matchChannel || !isConnected) return;

        const newMessage = {
            id: Date.now().toString(),
            text: text.trim(),
            sender: 'Me',
            senderId: 'me',
            timestamp: new Date(),
            type: 'text'
        };

        setMessages(prev => [...prev, newMessage]);

        publish(matchChannel, {
            type: 'chat-message',
            text: text.trim(),
            from: clientId,
            to: remotePeerId
        });
    }, [clientId, remotePeerId, matchChannel, isConnected, publish]);

    // Clear messages when chat ends
    useEffect(() => {
        if (!isConnectedToPartner) {
            setMessages([]);
        }
    }, [isConnectedToPartner]);

    // Ice Breaker Logic
    const [iceBreakerIndex, setIceBreakerIndex] = useState(0);

    // Extended list of ice breakers
    const iceBreakers = [
        "If you could have dinner with any historical figure, who would it be and why?",
        "What's the most adventurous thing you've ever done?",
        "If you could travel anywhere right now, where would you go?",
        "What is your favorite movie of all time?",
        "Do you have any hidden talents?",
        "What music do you like to listen to?",
        "Tea or Coffee? And how do you take it?",
        "What's your dream job?",
        "If you inherited a million dollars, what's the first thing you'd buy?"
    ];

    const currentIceBreaker = iceBreakers[iceBreakerIndex % iceBreakers.length];

    const shuffleIceBreaker = useCallback(() => {
        setIceBreakerIndex(prev => prev + 1);
    }, []);

    const sendIceBreakerToChat = useCallback(() => {
        handleSendMessage(currentIceBreaker);
    }, [handleSendMessage, currentIceBreaker]);

    // Placeholder SVG to mimic the OBS logo in the images
    const PlaceholderIcon = () => (
        <svg viewBox="0 0 100 100" className="h-32 w-32 text-white/10 z-0" fill="none" stroke="currentColor" strokeWidth="6">
            <circle cx="50" cy="50" r="30" />
            <path d="M 50 20 A 30 30 0 0 1 71.21 28.79" />
            <path d="M 50 80 A 30 30 0 0 1 28.79 71.21" />
            <path d="M 28.79 28.79 A 30 30 0 0 1 50 20" transform="rotate(120 50 50)" />
            <path d="M 71.21 71.21 A 30 30 0 0 1 50 80" transform="rotate(120 50 50)" />
            <path d="M 50 20 A 30 30 0 0 1 71.21 28.79" transform="rotate(240 50 50)" />
            <path d="M 50 80 A 30 30 0 0 1 28.79 71.21" transform="rotate(240 50 50)" />
        </svg>
    );

    return (
        <div className="min-h-screen relative overflow-hidden" style={honeycombBackground}>
            <header className="hidden md:block fixed top-0 left-0 right-0 z-50 transition-all duration-300">
                <div className="absolute inset-0 bg-white/40 backdrop-blur-xl border-b border-white/20 shadow-sm"></div>
                <div className="max-w-7xl mx-auto px-6 h-16 relative flex justify-between items-center">

                    {/* LEFT: Branding & Status */}
                    <div className="flex items-center gap-6">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2 group">
                            <Logo size="md" />
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-2 bg-white/50 border border-white/20 px-2 py-0.5 rounded-full hidden sm:inline-block">Video Chat</span>
                        </Link>

                        <div className="flex items-center gap-3">
                            <FeedbackButton variant="ghost" showText={false} className="hidden sm:inline-flex" />
                            <div className="h-6 w-px bg-slate-200/30 hidden sm:block" />
                        </div>

                        <div className="h-6 w-px bg-gray-200/50 hidden md:block"></div>

                        {/* Status Pillars */}
                        <div className="hidden md:flex items-center gap-3">
                            {isConnectedToPartner && !isRevealed && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50/50 border border-blue-100/50 backdrop-blur-sm transition-all hover:bg-blue-50">
                                    <div className="relative">
                                        <div className={`h-2.5 w-2.5 rounded-full ${chatDuration < 60 ? 'bg-indigo-500' : chatDuration < 180 ? 'bg-purple-500' : 'bg-pink-500'} animate-pulse`}></div>
                                        <div className={`absolute inset-0 rounded-full ${chatDuration < 60 ? 'bg-indigo-500' : chatDuration < 180 ? 'bg-purple-500' : 'bg-pink-500'} animate-ping opacity-20`}></div>
                                    </div>
                                    <span className="text-xs font-semibold text-slate-700">
                                        {chatDuration < 60 ? "Getting to Know" : chatDuration < 180 ? "Deepening Bond" : "Reveal Ready"}
                                    </span>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-slate-500 border border-slate-100">
                                        {blurAmount}% Blur
                                    </span>
                                </div>
                            )}

                            {isConnectedToPartner && isRevealed && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50/50 border border-green-100/50 backdrop-blur-sm">
                                    <Eye className="h-3.5 w-3.5 text-green-600" />
                                    <span className="text-xs font-semibold text-green-700">Fully Revealed</span>
                                </div>
                            )}
                        </div>
                        {connectionStatus !== 'connected' && connectionStatus !== 'connecting' && isConnectedToPartner && (
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center gap-3 text-yellow-700 shadow-sm animate-pulse">
                                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                                <span className="font-medium text-sm">
                                    {connectionStatus === 'reconnecting' ? 'Connection unstable, trying to reconnect...' : 'Connection lost'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Actions & Controls */}
                    <div className="flex items-center gap-4">
                        {isSearching && (
                            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50/50 border border-indigo-100/50">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                                </span>
                                <span className="text-xs font-medium text-indigo-700 animate-pulse">Searching for partner...</span>
                            </div>
                        )}

                        {isConnectedToPartner && remotePeerId && (
                            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50/50 border border-emerald-100/50">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                                <span className="text-xs font-medium text-emerald-700">Live Connection</span>
                            </div>
                        )}

                        {myStream && (isConnectedToPartner || isSearching) && (
                            <button
                                onClick={toggleLayout}
                                className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/50 hover:bg-white text-slate-600 shadow-sm border border-white/20 transition-all hover:scale-105 active:scale-95"
                                title={layout === 'horizontal' ? 'Switch to Vertical' : 'Switch to Horizontal'}
                            >
                                {layout === 'horizontal' ? <LayoutPanelTop className="h-4 w-4" /> : <LayoutPanelLeft className="h-4 w-4" />}
                            </button>
                        )}

                        <button
                            onClick={() => setShowInstructions(true)}
                            className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/50 hover:bg-white text-slate-600 shadow-sm border border-white/20 transition-all hover:scale-105 active:scale-95"
                            title="How it Works"
                        >
                            <HelpCircle className="h-5 w-5" />
                        </button>

                        <button
                            onClick={() => setIsReactionSettingsOpen(true)}
                            className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/50 hover:bg-white text-slate-600 shadow-sm border border-white/20 transition-all hover:scale-105 active:scale-95"
                            title="Recording Settings"
                        >
                            <Settings className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Note: ConnectionPopup removed in favor of in-video animation */}

            {!isSearching && !isConnectedToPartner && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pt-24 px-4 bg-slate-900/40 backdrop-blur-md">
                    {isLoadingPrefs ? (
                        <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl shadow-2xl">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            <p className="text-gray-500 font-medium">Loading preferences...</p>
                        </div>
                    ) : (
                        <div className="w-full max-w-xl mx-auto rounded-3xl shadow-2xl bg-white backdrop-blur-xl border border-white/50">
                            <div className="p-10 text-center">
                                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl mx-auto mb-8 animate-float">
                                    <Users className="h-10 w-10 text-white" />
                                </div>
                                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-2">Ready to Mingle?</h2>
                                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                                    You are set to verify our unique phased blur experience.
                                </p>

                                <div className="bg-white/50 rounded-xl p-4 mb-8 inline-block text-left w-full border border-white/60 shadow-sm">
                                    <p className="text-sm text-gray-500 uppercase tracking-wide font-bold mb-2">Current Preferences</p>
                                    <div className="flex flex-wrap gap-2 text-sm text-gray-700">
                                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100 font-medium">
                                            Looking for: {lookingFor === 'any' ? 'Anyone' : lookingFor.charAt(0).toUpperCase() + lookingFor.slice(1)}
                                        </span>
                                        {interests.length > 0 && interests.map(i => (
                                            <span key={i} className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full border border-purple-100 font-medium">
                                                {i}
                                            </span>
                                        ))}
                                        {interests.length === 0 && <span className="text-gray-400 italic">No interests selected</span>}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <button
                                        onClick={startRandomChat}
                                        className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group"
                                    >
                                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></span>
                                        Start Video Chat
                                    </button>
                                    <button
                                        onClick={() => router.push('/lobby')}
                                        className="w-full px-6 py-3 rounded-xl bg-white border-2 border-transparent hover:border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Settings className="h-4 w-4" />
                                        Change Preferences
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {(myStream || isConnectedToPartner || isSearching) && (
                <div className="w-full">
                    <div className="pt-2 pb-[80px] md:pb-4 md:pt-20 px-4 md:px-10 h-[100dvh] md:h-[calc(100vh-20px)]">
                        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6 h-full">
                            <div className="col-span-full lg:col-span-1">
                                <div className={`flex gap-1 h-full ${layout === 'horizontal' ? 'flex-col md:flex-row' : 'flex-col items-center justify-center'}`}>
                                    {/* REMOTE VIDEO CONTAINER */}
                                    <div className={`bg-gradient-to-br from-[#3a375e] to-[#2c2a4a] rounded-xl overflow-hidden relative flex items-center justify-center shadow-2xl ring-1 ring-white/10 group ${layout === 'horizontal' ? 'flex-1 min-h-[308px] w-full' : 'flex-1 min-h-0 w-auto aspect-square max-w-[800px]'}`}>



                                        {/* IN-VIDEO SEARCHING ANIMATION */}
                                        {isSearching && (
                                            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                                                <div className="relative">
                                                    <div className="h-24 w-24 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <Users className="h-8 w-8 text-white animate-pulse" />
                                                    </div>
                                                </div>
                                                <p className="text-white font-medium mt-6 text-lg animate-pulse">Finding a partner...</p>
                                                <button
                                                    onClick={() => setIsSearching(false)}
                                                    className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-medium backdrop-blur-md transition-colors border border-white/20"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        )}

                                        <PlaceholderIcon />
                                        <VideoWatermark />
                                        <video
                                            ref={remoteVideoRef}
                                            autoPlay
                                            playsInline
                                            className="absolute inset-0 w-full h-full object-cover rounded-xl z-10"
                                        />

                                        {/* Mobile Only: Top-Right Overlays */}
                                        <div className="md:hidden absolute top-4 right-4 z-20 flex gap-2">
                                            <button
                                                onClick={() => setShowInstructions(true)}
                                                className="bg-black/40 hover:bg-black/60 p-2 rounded-full backdrop-blur-md border border-white/10 shadow-lg active:scale-95 transition-all"
                                                title="How it Works"
                                            >
                                                <HelpCircle className="h-4 w-4 text-white" />
                                            </button>
                                            <button
                                                onClick={() => setIsReactionSettingsOpen(true)}
                                                className="bg-black/40 hover:bg-black/60 p-2 rounded-full backdrop-blur-md border border-white/10 shadow-lg active:scale-95 transition-all"
                                                title="Settings"
                                            >
                                                <Settings className="h-4 w-4 text-white" />
                                            </button>
                                        </div>
                                        {remotePeerId && (
                                            <div className="absolute top-4 left-4 bg-black/50 text-white px-4 py-1.5 rounded-full text-sm z-20 flex items-center gap-2 backdrop-blur-md border border-white/10">
                                                <span className="h-2.5 w-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]"></span>
                                                Stranger
                                            </div>
                                        )}
                                        {remotePeerId && partnerRevealRequested && !isRevealed && (
                                            <div className="absolute top-16 left-4 bg-pink-500/90 text-white px-4 py-1.5 rounded-full text-sm z-20 animate-pulse shadow-lg font-medium">
                                                Partner wants to reveal!
                                            </div>
                                        )}
                                        {remoteStream && (
                                            <div className="absolute bottom-4 right-4 z-20 flex gap-2">
                                                <div
                                                    onClick={() => takeSnapshot(remoteVideoRef.current)}
                                                    className="bg-purple-500/80 hover:bg-purple-500 p-2.5 rounded-full backdrop-blur-md shadow-lg cursor-pointer transition-transform hover:scale-105 active:scale-95"
                                                    title="Take Snapshot"
                                                >
                                                    <Camera className="h-5 w-5 text-white" />
                                                </div>
                                                <div className="bg-black/50 p-2.5 rounded-full backdrop-blur-md border border-white/5">
                                                    <VideoOff className="h-5 w-5 text-white/50" />
                                                </div>
                                                <div className="bg-black/50 p-2.5 rounded-full backdrop-blur-md border border-white/5">
                                                    <MicOff className="h-5 w-5 text-white/50" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* LOCAL VIDEO CONTAINER */}
                                    <div className={`bg-gradient-to-br from-[#3a375e] to-[#2c2a4a] rounded-xl overflow-hidden relative flex items-center justify-center shadow-2xl ring-1 ring-white/10 ${layout === 'horizontal' ? 'flex-1 min-h-[308px] w-full' : 'flex-1 min-h-0 w-auto aspect-square max-w-[800px]'}`}>
                                        <PlaceholderIcon />
                                        <VideoWatermark />
                                        {rawStream && (
                                            <>
                                                <video
                                                    ref={localVideoRef}
                                                    autoPlay
                                                    muted
                                                    playsInline
                                                    className="absolute inset-0 w-full h-full object-cover rounded-xl z-10 scale-x-[-1]" // Mirror effect
                                                />
                                                <div className="absolute top-4 left-4 bg-black/50 text-white px-4 py-1.5 rounded-full text-sm z-20 flex items-center gap-2 backdrop-blur-md border border-white/10">
                                                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]"></span>
                                                    You
                                                </div>

                                                <div className="absolute bottom-4 right-4 z-20 flex gap-2">
                                                    <div
                                                        onClick={() => takeSnapshot(localVideoRef.current, true)}
                                                        className="bg-white/20 hover:bg-white/30 p-2.5 rounded-full backdrop-blur-md shadow-lg cursor-pointer transition-transform hover:scale-105 active:scale-95 border border-white/10"
                                                        title="Take Snapshot"
                                                    >
                                                        <Camera className="h-5 w-5 text-white" />
                                                    </div>
                                                    {!isVideoEnabled && (
                                                        <div className="bg-red-500/80 p-2.5 rounded-full backdrop-blur-md shadow-lg">
                                                            <VideoOff className="h-5 w-5 text-white " />
                                                        </div>
                                                    )}
                                                    {!isAudioEnabled && (
                                                        <div className="bg-red-500/80 p-2.5 rounded-full backdrop-blur-md shadow-lg">
                                                            <MicOff className="h-5 w-5 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="hidden lg:flex flex-col h-full gap-3">


                                {/* Ice Breaker / Info Section */}
                                {isConnectedToPartner && (
                                    <div className="p-3 bg-white/90 rounded-2xl border border-blue-100 shadow-md backdrop-blur-sm relative overflow-hidden group transition-all hover:shadow-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 rounded-xl text-blue-600 flex-shrink-0">
                                                <MessageCircle className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center gap-2">
                                                    <p className="text-gray-700 text-sm font-medium leading-tight line-clamp-2 italic">
                                                        "{currentIceBreaker}"
                                                    </p>
                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                        <button
                                                            onClick={sendIceBreakerToChat}
                                                            className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                                            title="Send to chat"
                                                        >
                                                            <Send className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={shuffleIceBreaker}
                                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
                                                            title="New Question"
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col h-[420px] bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl overflow-hidden shrink-0">
                                    {/* Chat Header */}
                                    <div className="p-4 border-b border-gray-100 bg-white/50 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                                            <span className="font-semibold text-gray-700 text-sm">Live Chat</span>
                                        </div>
                                        {remotePeerId && <span className="text-xs text-gray-400 font-mono">ID: {remotePeerId.slice(0, 4)}...</span>}
                                    </div>

                                    <div className="flex-1 min-h-0 relative p-1">
                                        <Chatbox
                                            messages={messages}
                                            onSendMessage={handleSendMessage}
                                            className="h-full bg-transparent"
                                        />
                                    </div>
                                    <div className="p-1 bg-gray-50/50 border-t border-gray-100">
                                        {renderControlButtons('chat')}
                                    </div>
                                </div>

                                {/* SIDE PANEL EXTRAS: SHARE & SAFETY */}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Share Card */}
                                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <Share2 className="h-12 w-12" />
                                        </div>
                                        <h3 className="font-bold text-lg mb-1">Invite Friends</h3>
                                        <p className="text-indigo-100 text-xs mb-3">Share WHOBEE & have fun!</p>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(window.location.origin);
                                                // Optional: Add toast notification here
                                            }}
                                            className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-md py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors border border-white/10"
                                        >
                                            <Copy className="h-3.5 w-3.5" />
                                            Copy Link
                                        </button>
                                    </div>

                                    {/* Safety Card */}
                                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-2 text-gray-700 mb-2">
                                            <ShieldCheck className="h-5 w-5 text-green-500" />
                                            <h3 className="font-bold text-sm">Community Safe</h3>
                                        </div>
                                        <p className="text-xs text-gray-500 leading-relaxed mb-2">
                                            Be respectful. Zero tolerance for harassment.
                                        </p>
                                        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                                            <Heart className="h-3 w-3 text-pink-500 fill-pink-500" />
                                            Good Vibes Only
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {(myStream || isConnectedToPartner) && !isChatOpen && (
                <div className="fixed bottom-3 left-0 right-0 z-50 md:hidden px-2">
                    <div className="mx-auto max-w-md">
                        {renderControlButtons('floating')}
                    </div>
                </div>
            )}

            {myStream && isChatOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center md:hidden"
                    onClick={toggleChat}
                >
                    <div
                        className="rounded-t-2xl shadow-2xl flex flex-col w-full max-h-[70vh] bg-white"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex-1 min-h-0 p-2">
                            <Chatbox
                                messages={messages}
                                onSendMessage={handleSendMessage}
                                className="h-full border shadow-none"
                            />
                        </div>
                        <div className="p-4 border-t">
                            {renderControlButtons('floating')}
                        </div>
                    </div>
                </div>
            )}
            {/* INSTRUCTIONS MODAL */}
            {showInstructions && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-white/50 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <span className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white p-1.5 rounded-lg shadow-sm">
                                    <HelpCircle className="h-5 w-5" />
                                </span>
                                How WHOBEE Works
                            </h3>
                            <button
                                onClick={() => setShowInstructions(false)}
                                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 mt-1">
                                        <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">1</div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-800">The Blur Phase</h4>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            Video starts 100% blurred. Focus on conversation first! The blur slowly reduces as you talk.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 mt-1">
                                        <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">2</div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-800">The Outline Phase</h4>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            After 60 seconds, you'll see outlines. The connection is deepening.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 mt-1">
                                        <div className="h-8 w-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold">3</div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-800">The Reveal</h4>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            After 3 minutes (or if you both agree), the video unblurs completely. It's a match!
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 flex gap-3">
                                <ShieldCheck className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold text-sm text-yellow-800 mb-1">Community Guidelines</h4>
                                    <p className="text-xs text-yellow-700 leading-relaxed">
                                        We have zero tolerance for harassment or nudity. Keep it fun, respectful, and friendly!
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setShowInstructions(false)}
                                className="px-6 py-2 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
                            >
                                Got it!
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* VIRAL REACTION SHARE MODAL */}
            {recordedVideoUrl && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-sm flex items-center justify-between mb-4">
                        <h3 className="text-white text-xl font-bold flex items-center gap-2">
                            <Sparkles className="h-6 w-6 text-yellow-400" />
                            Your Reaction!
                        </h3>
                        <button onClick={clearRecording} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="relative w-full max-w-sm aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10">
                        <video
                            src={recordedVideoUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <div className="w-full max-w-sm mt-6 flex gap-3">
                        <button
                            onClick={shareVideo}
                            className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
                        >
                            <Share2 className="h-6 w-6" />
                            Share to TT / IG
                        </button>
                        <button
                            onClick={downloadVideo}
                            className="px-6 bg-white/20 hover:bg-white/30 text-white font-bold py-4 rounded-2xl shadow-lg backdrop-blur-md flex items-center justify-center active:scale-95 transition-all"
                            title="Download Video"
                        >
                            <span className="sr-only">Download</span>
                            <Copy className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            )}

            {/* REACTION SETTINGS MODAL */}
            {isReactionSettingsOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-white/50 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Settings className="h-5 w-5 text-slate-500" />
                                Recording Settings
                            </h3>
                            <button
                                onClick={() => setIsReactionSettingsOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-semibold text-gray-700">Pre-Reveal (Anticipation)</label>
                                        <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{preRevealTime}s</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0" max="5" step="1"
                                        value={preRevealTime}
                                        onChange={(e) => setPreRevealTime(parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">How many seconds to record *before* the blur drops.</p>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-semibold text-gray-700">Post-Reveal (Reaction)</label>
                                        <span className="text-sm font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">{postRevealTime}s</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1" max="10" step="1"
                                        value={postRevealTime}
                                        onChange={(e) => setPostRevealTime(parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">How many seconds to record *after* the blur drops.</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setIsReactionSettingsOpen(false)}
                                className="px-6 py-2 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
                            >
                                Save Settings
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RandomChatPage;