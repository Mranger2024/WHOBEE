"use client";

import React, { useEffect, useCallback, useState } from "react";
import ReactPlayer from "react-player";
import peer from "@/service/peer";
import { useCentrifugo } from "@/context/CentrifugoProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Video,
    Phone,
    PhoneOff,
    Mic,
    MicOff,
    Video as VideoIcon,
    VideoOff,
    MessageCircle
} from "lucide-react";
import Image from "next/image";
import { Chat } from "@/components/public-room/chat";
import { PublicRoomMessage } from "@/types/public-room";

interface RemoteUserProfile {
    id: string;
    displayName?: string;
    avatarUrl?: string | null;
}

interface Profile {
    id: string;
    display_name?: string;
    avatar_url?: string | null;
    [key: string]: any;
}

const RoomPage = () => {
    const roomId = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : '';
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState<PublicRoomMessage[]>([]);

    const {
        clientId,
        isConnected,
        subscribe,
        publish,
        joinRoom,
        leaveRoom,
        getPresence
    } = useCentrifugo();

    const [remotePeerId, setRemotePeerId] = useState<string | null>(null);
    const [myStream, setMyStream] = useState<MediaStream>();
    const [remoteStream, setRemoteStream] = useState<MediaStream>();
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isCallInitiator, setIsCallInitiator] = useState(false);
    const [myProfile, setMyProfile] = useState<Profile | null>(null);
    const [userEmail, setUserEmail] = useState<string>("");
    const [remoteUserProfile, setRemoteUserProfile] = useState<RemoteUserProfile | null>(null);
    const [hasAnswered, setHasAnswered] = useState(false);

    const channel = `room_${roomId}`;

    // Function to share profile info with remote peer
    const shareProfileInfo = useCallback(() => {
        if (!remotePeerId || !isConnected) return;

        const profileData = {
            id: userEmail || clientId,
            displayName: myProfile?.display_name || userEmail || 'Me',
            avatarUrl: myProfile?.avatar_url
        };

        console.log('Sharing profile info with remote peer:', profileData);
        publish(channel, {
            type: 'profile-info',
            profileData,
            from: clientId,
            to: remotePeerId
        });
    }, [remotePeerId, isConnected, userEmail, myProfile, clientId, channel, publish]);

    const handleSendMessage = useCallback((text: string) => {
        if (!text.trim() || !isConnected) return;

        const newMessage: PublicRoomMessage = {
            id: Date.now().toString(),
            text: text.trim(),
            sender: myProfile?.display_name || userEmail || 'Me',
            senderId: 'me', // 'me' for local user
            timestamp: new Date(),
            type: 'text'
        };

        // Optimistically add message
        setMessages(prev => [...prev, newMessage]);

        // Send to Centrifugo
        publish(channel, {
            type: 'chat-message',
            message: {
                ...newMessage,
                senderId: clientId // Send actual client ID
            },
            from: clientId
        });
    }, [isConnected, channel, publish, myProfile, userEmail, clientId]);

    const handleChatMessage = useCallback((data: any) => {
        if (data.type !== 'chat-message' || data.from === clientId) return;

        const incomingMessage = data.message;
        setMessages(prev => [...prev, {
            ...incomingMessage,
            senderId: incomingMessage.senderId // Keep original sender ID
        }]);
    }, [clientId]);

    const handleUserJoined = useCallback((data: any) => {
        if (data.type !== 'user-joined' || data.id === clientId) return;
        console.log(`User ${data.id} joined room`);
        setRemotePeerId(data.id);
    }, [clientId]);

    const handleCallUser = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
        });
        setMyStream(stream);

        if (stream && peer.peer) {
            const senders = peer.peer.getSenders();
            const tracks = stream.getTracks();

            // Remove any existing tracks
            senders.forEach(sender => {
                peer.peer?.removeTrack(sender);
            });

            // Add new tracks
            tracks.forEach(track => {
                peer.peer?.addTrack(track, stream);
            });
        }

        const offer = await peer.getOffer();
        if (remotePeerId && offer) {
            publish(channel, {
                type: "offer",
                offer,
                from: clientId,
                to: remotePeerId
            });
            setIsCallInitiator(true);

            // Share profile info when starting a call
            shareProfileInfo();
        }
    }, [remotePeerId, clientId, channel, publish, shareProfileInfo]);

    const handleIncomingCall = useCallback(
        async (data: any) => {
            if (data.type !== 'offer' || data.to !== clientId) return;

            setRemotePeerId(data.from);
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true,
            });
            setMyStream(stream);

            if (stream && peer.peer) {
                const senders = peer.peer.getSenders();
                const tracks = stream.getTracks();

                // Remove any existing tracks
                senders.forEach(sender => {
                    peer.peer?.removeTrack(sender);
                });

                // Add new tracks
                tracks.forEach(track => {
                    peer.peer?.addTrack(track, stream);
                });
            }

            console.log(`Incoming Call from ${data.from}`);
            const ans = await peer.getAnswer(data.offer);
            if (ans) {
                publish(channel, {
                    type: "answer",
                    ans,
                    from: clientId,
                    to: data.from
                });
                setIsCallInitiator(false);
                setHasAnswered(true);

                // Share profile info when answering a call
                if (myProfile) {
                    shareProfileInfo();
                }
            }
        },
        [clientId, channel, publish, myProfile, shareProfileInfo]
    );

    const sendStreams = useCallback(() => {
        if (!myStream || !peer.peer) return;
        console.log('Sending streams to remote peer...');

        try {
            const audioTrack = myStream.getAudioTracks()[0];
            const videoTrack = myStream.getVideoTracks()[0];

            const senders = peer.peer.getSenders();
            const audioSender = senders.find(sender => sender.track?.kind === 'audio');
            const videoSender = senders.find(sender => sender.track?.kind === 'video');

            if (audioTrack) {
                if (audioSender) {
                    console.log('Replacing existing audio track');
                    audioSender.replaceTrack(audioTrack);
                } else {
                    console.log('Adding new audio track');
                    peer.peer.addTrack(audioTrack, myStream);
                }
            }

            if (videoTrack) {
                if (videoSender) {
                    console.log('Replacing existing video track');
                    videoSender.replaceTrack(videoTrack);
                } else {
                    console.log('Adding new video track');
                    peer.peer.addTrack(videoTrack, myStream);
                }
            }

            console.log('Streams updated successfully');

            if (remotePeerId && peer.peer.signalingState === 'stable') {
                console.log('Creating new offer for:', remotePeerId);
                peer.peer.createOffer({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true
                }).then(offer => {
                    return peer.peer?.setLocalDescription(offer);
                }).then(() => {
                    const offer = peer.peer?.localDescription;
                    publish(channel, {
                        type: 'peer-nego-needed',
                        offer,
                        from: clientId,
                        to: remotePeerId
                    });
                }).catch(err => {
                    console.error('Error creating or setting offer:', err);
                });
            }
            setHasAnswered(true);
        } catch (err) {
            console.error('Error sending streams:', err);
        }
    }, [myStream, remotePeerId, clientId, channel, publish]);

    const handleCallAccepted = useCallback(
        (data: any) => {
            if (data.type !== 'answer' || data.to !== clientId) return;
            peer.setLocalDescription(data.ans);
            console.log("Call Accepted!");
        },
        [clientId]
    );

    const handleNegoNeeded = useCallback(async () => {
        try {
            const offer = await peer.getOffer();
            if (remotePeerId && offer) {
                if (peer.peer?.signalingState !== 'stable') {
                    console.log('Signaling state not stable, skipping negotiation');
                    return;
                }
                publish(channel, {
                    type: "peer-nego-needed",
                    offer,
                    from: clientId,
                    to: remotePeerId
                });
            }
        } catch (err) {
            console.error('Error during negotiation:', err);
        }
    }, [remotePeerId, clientId, channel, publish]);

    useEffect(() => {
        if (!peer.peer) return;
        peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
        return () => {
            if (!peer.peer) return;
            peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
        };
    }, [handleNegoNeeded]);

    const handleNegoNeedIncoming = useCallback(
        async (data: any) => {
            if (data.type !== 'peer-nego-needed' || data.to !== clientId) return;

            try {
                if (peer.peer?.signalingState !== 'stable') {
                    console.log('Waiting for signaling state to stabilize');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                const ans = await peer.getAnswer(data.offer);
                if (ans) {
                    publish(channel, {
                        type: "peer-nego-final",
                        ans,
                        from: clientId,
                        to: data.from
                    });
                }
            } catch (err) {
                console.error('Error handling incoming negotiation:', err);
            }
        },
        [clientId, channel, publish]
    );

    const handleNegoNeedFinal = useCallback(async (data: any) => {
        if (data.type !== 'peer-nego-final' || data.to !== clientId) return;
        await peer.setLocalDescription(data.ans);
    }, [clientId]);

    // Handle ICE candidates
    useEffect(() => {
        if (!peer.peer) return;

        // Send ICE candidates to remote peer
        const handleIceCandidate = (event: RTCPeerConnectionIceEvent) => {
            if (event.candidate && remotePeerId) {
                console.log('Sending ICE candidate to:', remotePeerId);
                publish(channel, {
                    type: 'ice-candidate',
                    candidate: event.candidate,
                    from: clientId,
                    to: remotePeerId
                });
            }
        };

        peer.peer.addEventListener('icecandidate', handleIceCandidate);
        peer.peer.addEventListener("track", async (ev: RTCTrackEvent) => {
            const remoteStream = ev.streams;
            console.log("GOT TRACKS!!");
            setRemoteStream(remoteStream[0]);
        });

        return () => {
            if (peer.peer) {
                peer.peer.removeEventListener('icecandidate', handleIceCandidate);
            }
        };
    }, [remotePeerId, clientId, channel, publish]);

    // Handle receiving ICE candidates
    const handleIceCandidate = useCallback(async (data: any) => {
        if (data.type !== 'ice-candidate' || data.to !== clientId) return;

        try {
            if (peer.peer && data.candidate) {
                console.log('Received ICE candidate from:', data.from);

                // Check if remote description is set before adding candidate
                if (peer.peer.remoteDescription) {
                    await peer.peer.addIceCandidate(new RTCIceCandidate(data.candidate));
                } else {
                    console.log('Remote description not set yet, queuing ICE candidate');
                    // Queue the candidate to be added after remote description is set
                    // This will be handled when setRemoteDescription is called
                }
            }
        } catch (err) {
            console.error('Error adding ICE candidate:', err);
        }
    }, [clientId]);

    // Handle receiving profile info from remote peer
    const handleProfileInfo = useCallback((data: any) => {
        if (data.type !== 'profile-info' || data.to !== clientId) return;
        console.log('Received profile info from remote peer:', data.from, data.profileData);
        if (data.profileData) {
            setRemoteUserProfile(data.profileData);
            if (data.profileData.id && !userEmail) {
                setUserEmail(data.profileData.id);
            }
        }
    }, [clientId, userEmail]);

    // Effect to share profile whenever it changes or remote peer changes
    useEffect(() => {
        if (remotePeerId) {
            shareProfileInfo();
        }
    }, [myProfile, remotePeerId, userEmail, shareProfileInfo]);

    // Subscribe to room channel and handle all events
    useEffect(() => {
        if (!roomId || !isConnected) return;

        console.log('Subscribing to room:', roomId);

        const handleMessage = (data: any) => {
            console.log('Room message:', data);
            handleUserJoined(data);
            handleIncomingCall(data);
            handleCallAccepted(data);
            handleNegoNeedIncoming(data);
            handleNegoNeedFinal(data);
            handleIceCandidate(data);
            handleProfileInfo(data);
            handleChatMessage(data);
        };

        const unsubscribe = subscribe(channel, handleMessage);

        // Join room and announce presence
        joinRoom(roomId, userEmail || clientId || 'User', 'room');

        // Announce join event
        publish(channel, {
            type: "user-joined",
            id: clientId,
            email: userEmail
        });

        // Get presence to find existing users
        getPresence(channel).then((presence) => {
            console.log('Room presence:', presence);
            const clients = presence?.result?.presence || presence?.presence || {};

            const otherUser = Object.values(clients).find((client: any) => {
                return client.client !== clientId && client.user !== clientId;
            });

            if (otherUser) {
                console.log('Found existing user from presence:', otherUser);
                // @ts-ignore
                setRemotePeerId(otherUser.client || otherUser.user);
            }
        }).catch(err => {
            console.error('Failed to get presence:', err);
        });

        return () => {
            unsubscribe();
            leaveRoom(roomId, 'room');
        };
    }, [roomId, isConnected, channel, subscribe, joinRoom, leaveRoom, getPresence, clientId, userEmail, publish, handleChatMessage]);

    const toggleAudio = useCallback(() => {
        if (myStream) {
            const audioTrack = myStream.getAudioTracks()[0];
            audioTrack.enabled = !audioTrack.enabled;
            setIsAudioEnabled(audioTrack.enabled);
        }
    }, [myStream]);

    const toggleVideo = useCallback(() => {
        if (myStream) {
            const videoTrack = myStream.getVideoTracks()[0];
            videoTrack.enabled = !videoTrack.enabled;
            setIsVideoEnabled(videoTrack.enabled);
        }
    }, [myStream]);

    return (
        <div className="min-h-screen flex flex-col" style={{
            backgroundImage: `
                radial-gradient(circle at 100px 100px, rgba(59, 130, 246, 0.1) 2%, transparent 2%),
                radial-gradient(circle at 200px 200px, rgba(59, 130, 246, 0.1) 2%, transparent 2%),
                radial-gradient(circle at 300px 100px, rgba(59, 130, 246, 0.1) 2%, transparent 2%),
                radial-gradient(circle at 400px 200px, rgba(59, 130, 246, 0.1) 2%, transparent 2%)
            `,
            backgroundSize: '100px 100px',
            backgroundPosition: '0 0, 50px 50px, 50px 0, 0 50px, 25px 25px',
            backgroundColor: 'rgb(239 246 255)'
        }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 backdrop-blur-sm border-b border-white/20 p-4 shadow-lg mb-6">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                            <Video className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-white">Video Chat Room</h1>
                    </div>
                    <div>
                        <Badge variant={remotePeerId ? "default" : "secondary"} className={`${remotePeerId ? "bg-green-500 hover:bg-green-600" : "bg-white/20 text-white hover:bg-white/30"} border-none`}>
                            {remotePeerId ? "Connected" : "Waiting for peer"}
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto w-full px-4 space-y-6">

                {!remotePeerId && (
                    <Alert className="bg-blue-500/10 border-blue-500/20 text-blue-900">
                        <AlertDescription>
                            Waiting for someone to join. Share this room link with others to start a video chat.
                        </AlertDescription>
                    </Alert>
                )}

                {myStream ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:mb-5 mb-1 md:mt-1 h-[80vh]">
                        <div className="md:col-span-2 flex flex-col gap-4">
                            {/* My Stream */}
                            <div className="relative bg-black md:rounded-lg md:overflow-hidden mb-1">
                                <ReactPlayer
                                    playing
                                    muted
                                    height="100%"
                                    width="100%"
                                    url={myStream}
                                    className="aspect-video"
                                />
                                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 p-2 rounded-lg flex items-center gap-2">
                                    {myProfile?.avatar_url ? (
                                        <div className="relative w-8 h-8 overflow-hidden rounded-full">
                                            <Image
                                                src={myProfile.avatar_url}
                                                alt={myProfile.display_name || 'Me'}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white shadow-sm">
                                            {(myProfile?.display_name || 'Me').charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <span className="text-white text-sm font-medium">
                                        {myProfile?.display_name || 'Me'}
                                    </span>
                                </div>
                            </div>

                            {/* Remote Stream */}
                            {remoteStream && (
                                <div className="relative bg-black rounded-lg overflow-hidden">
                                    <ReactPlayer
                                        playing={true}
                                        muted={false}
                                        height="100%"
                                        width="100%"
                                        url={remoteStream}
                                        className="aspect-video"
                                    />
                                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 p-2 rounded-lg flex items-center gap-2">
                                        {remoteUserProfile?.avatarUrl ? (
                                            <div className="relative w-8 h-8 overflow-hidden rounded-full">
                                                <Image
                                                    src={remoteUserProfile.avatarUrl}
                                                    alt={remoteUserProfile.displayName || 'Participant'}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white shadow-sm">
                                                {remoteUserProfile?.displayName ?
                                                    remoteUserProfile.displayName.charAt(0).toUpperCase() :
                                                    remoteUserProfile?.id ?
                                                        remoteUserProfile.id.charAt(0).toUpperCase() : 'P'}
                                            </div>
                                        )}
                                        <span className="text-white text-sm font-medium">
                                            {remoteUserProfile?.displayName || remoteUserProfile?.id || 'Participant'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Chat Panel */}
                        <div className={`hidden md:block h-full bg-white rounded-lg overflow-hidden shadow-xl border border-white/20 ${isChatOpen ? 'block' : 'hidden md:block'}`}>
                            <div className="p-4 border-b bg-gradient-to-r from-blue-500 to-purple-600">
                                <h3 className="font-bold flex items-center gap-2 text-white">
                                    <MessageCircle className="w-5 h-5" />
                                    Chat
                                </h3>
                            </div>
                            <div className="h-[calc(100%-60px)]">
                                <Chat
                                    messages={messages}
                                    onSendMessage={handleSendMessage}
                                    className="h-full border-0 rounded-none"
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl max-w-md w-full text-center border border-white/50">
                            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center shadow-lg mx-auto mb-6">
                                <Video className="h-8 w-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-semibold mb-3 text-gray-800">Join Video Conference</h2>
                            <p className="text-gray-600 mb-8">Click the button below to join the video conference</p>
                            <Button
                                onClick={handleCallUser}
                                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 py-6 px-8 rounded-xl w-full text-lg font-medium"
                            >
                                <Video className="mr-2 h-5 w-5" />
                                Join Conference
                            </Button>
                        </div>
                    </div>
                )}

                {/* Controls */}
                {myStream && (
                    <div className="fixed bottom-6 md:left-3/4 left-1/2 md:transform -translate-x-1/2 z-50">
                        <div className="bg-gradient-to-r from-blue-500/90 to-purple-500/90 backdrop-blur-md rounded-full shadow-2xl p-4 flex items-center justify-center space-x-4 border border-white/20">
                            <Button
                                variant={isAudioEnabled ? "secondary" : "destructive"}
                                size="icon"
                                onClick={toggleAudio}
                                className="rounded-full"
                            >
                                {isAudioEnabled ? (
                                    <Mic className="h-4 w-4" />
                                ) : (
                                    <MicOff className="h-4 w-4" />
                                )}
                            </Button>
                            <Button
                                variant={isVideoEnabled ? "secondary" : "destructive"}
                                size="icon"
                                onClick={toggleVideo}
                                className="rounded-full"
                            >
                                {isVideoEnabled ? (
                                    <VideoIcon className="h-4 w-4" />
                                ) : (
                                    <VideoOff className="h-4 w-4" />
                                )}
                            </Button>

                            {!isCallInitiator && remotePeerId && !hasAnswered && (
                                <Button
                                    onClick={sendStreams}
                                    className="bg-green-500 hover:bg-green-600 rounded-full"
                                >
                                    <Phone className="mr-2 h-4 w-4" />
                                    Answer Call
                                </Button>
                            )}

                            <Button
                                variant="destructive"
                                size="icon"
                                className="rounded-full"
                                onClick={() => {
                                    if (myStream) {
                                        myStream.getTracks().forEach(track => track.stop());
                                        setMyStream(undefined);
                                    }
                                    if (remoteStream) {
                                        remoteStream.getTracks().forEach(track => track.stop());
                                        setRemoteStream(undefined);
                                    }
                                    if (peer.peer) {
                                        peer.peer.close();
                                        peer.peer = null;
                                    }
                                    setRemotePeerId(null);
                                    setIsCallInitiator(false);
                                    window.location.href = '/lobby';
                                }}
                            >
                                <PhoneOff className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="secondary"
                                size="icon"
                                className="md:hidden rounded-full shadow-lg bg-white/20 hover:bg-white/30 text-white"
                                onClick={() => setIsChatOpen(!isChatOpen)}
                            >
                                <MessageCircle className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoomPage;
