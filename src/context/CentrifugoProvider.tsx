'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { centrifugoClient } from '@/lib/centrifuge';

type CentrifugoContextType = {
    // Connection state
    isConnected: boolean;
    clientId: string;

    // Core methods
    subscribe: (channel: string, handler: (data: any) => void) => () => void;
    publish: (channel: string, data: any) => Promise<void>;
    getPresence: (channel: string) => Promise<any>;

    // WebRTC Signaling
    sendOffer: (channel: string, to: string, offer: RTCSessionDescriptionInit) => Promise<void>;
    sendAnswer: (channel: string, to: string, answer: RTCSessionDescriptionInit) => Promise<void>;
    sendIceCandidate: (channel: string, to: string, candidate: RTCIceCandidate) => Promise<void>;
    sendNegotiationNeeded: (channel: string, to: string, offer: RTCSessionDescriptionInit) => Promise<void>;
    sendNegotiationDone: (channel: string, to: string, answer: RTCSessionDescriptionInit) => Promise<void>;

    // Chat
    sendChatMessage: (channel: string, text: string, senderName: string) => Promise<void>;

    // Presence
    joinRoom: (roomId: string, userName: string, namespace?: string) => Promise<void>;
    leaveRoom: (roomId: string, namespace?: string) => Promise<void>;

    // Matching
    findRandomMatch: () => Promise<any>;
    cancelRandomMatch: () => Promise<any>;
    findVoiceMatch: () => Promise<any>;
    cancelVoiceMatch: () => Promise<any>;
    findTextMatch: () => Promise<any>;
    cancelTextMatch: () => Promise<any>;

    // Room Management
    getPublicRooms: () => Promise<any>;
    createPublicRoom: (name: string, description: string, creatorName: string) => Promise<any>;

    // Moderation
    reportUser: (reportedUserId: string, reportedIp: string, reason: string) => Promise<any>;
    checkBanStatus: (userId?: string, ip?: string) => Promise<any>;

    error: Error | null;
};

const CentrifugoContext = createContext<CentrifugoContextType | undefined>(undefined);

export function CentrifugoProvider({ children }: { children: ReactNode }) {
    const [isConnected, setIsConnected] = useState(false);
    const [clientId, setClientId] = useState('');
    const [error, setError] = useState<Error | null>(null);

    // Connect to Centrifugo when component mounts
    useEffect(() => {
        const handleConnected = (data: any) => {
            console.log('Connected to Centrifugo', data.clientId);
            setIsConnected(true);
            setClientId(data.clientId);
            setError(null);
        };

        const handleDisconnected = () => {
            console.log('Disconnected from Centrifugo');
            setIsConnected(false);
        };

        const handleError = (data: any) => {
            console.error('Centrifugo error:', data.error);
            setError(data.error instanceof Error ? data.error : new Error(String(data.error)));
        };

        // Connect to Centrifugo
        centrifugoClient.connect();

        // Set up event listeners
        centrifugoClient.on('connected', handleConnected);
        centrifugoClient.on('disconnected', handleDisconnected);
        centrifugoClient.on('error', handleError);

        // Clean up on unmount
        return () => {
            centrifugoClient.off('connected', handleConnected);
            centrifugoClient.off('disconnected', handleDisconnected);
            centrifugoClient.off('error', handleError);

            centrifugoClient.disconnect();
        };
    }, []);

    // Subscribe to channel
    const subscribe = useCallback((channel: string, handler: (data: any) => void) => {
        console.log("Subscribing to channel:", channel);

        // centrifugoClient.subscribe handles token fetching internally via getToken callback
        const unsubscribe = centrifugoClient.subscribe(channel, handler);

        return () => {
            console.log("Unsubscribe:", channel);
            unsubscribe();
        };
    }, []);



    // Publish to channel
    const publish = useCallback(async (channel: string, data: any) => {
        await centrifugoClient.publish(channel, data);
    }, []);

    // Get presence
    const getPresence = useCallback(async (channel: string) => {
        return await centrifugoClient.getPresence(channel);
    }, []);

    // WebRTC Signaling
    const sendOffer = useCallback(async (channel: string, to: string, offer: RTCSessionDescriptionInit) => {
        await centrifugoClient.sendOffer(channel, to, offer);
    }, []);

    const sendAnswer = useCallback(async (channel: string, to: string, answer: RTCSessionDescriptionInit) => {
        await centrifugoClient.sendAnswer(channel, to, answer);
    }, []);

    const sendIceCandidate = useCallback(async (channel: string, to: string, candidate: RTCIceCandidate) => {
        await centrifugoClient.sendIceCandidate(channel, to, candidate);
    }, []);

    const sendNegotiationNeeded = useCallback(async (channel: string, to: string, offer: RTCSessionDescriptionInit) => {
        await centrifugoClient.sendNegotiationNeeded(channel, to, offer);
    }, []);

    const sendNegotiationDone = useCallback(async (channel: string, to: string, answer: RTCSessionDescriptionInit) => {
        await centrifugoClient.sendNegotiationDone(channel, to, answer);
    }, []);

    // Chat
    const sendChatMessage = useCallback(async (channel: string, text: string, senderName: string) => {
        await centrifugoClient.sendChatMessage(channel, text, senderName);
    }, []);

    // Presence
    const joinRoom = useCallback(async (roomId: string, userName: string, namespace: string = 'room') => {
        await centrifugoClient.joinRoom(roomId, userName, namespace);
    }, []);

    const leaveRoom = useCallback(async (roomId: string, namespace: string = 'room') => {
        await centrifugoClient.leaveRoom(roomId, namespace);
    }, []);

    // Matching
    const findRandomMatch = useCallback(async () => {
        return await centrifugoClient.findRandomMatch();
    }, []);

    const cancelRandomMatch = useCallback(async () => {
        return await centrifugoClient.cancelRandomMatch();
    }, []);

    const findVoiceMatch = useCallback(async () => {
        return await centrifugoClient.findVoiceMatch();
    }, []);

    const cancelVoiceMatch = useCallback(async () => {
        return await centrifugoClient.cancelVoiceMatch();
    }, []);

    const findTextMatch = useCallback(async () => {
        return await centrifugoClient.findTextMatch();
    }, []);

    const cancelTextMatch = useCallback(async () => {
        return await centrifugoClient.cancelTextMatch();
    }, []);

    // Room Management
    const getPublicRooms = useCallback(async () => {
        return await centrifugoClient.getPublicRooms();
    }, []);

    const createPublicRoom = useCallback(async (name: string, description: string, creatorName: string) => {
        return await centrifugoClient.createPublicRoom(name, description, creatorName);
    }, []);

    // Moderation
    const reportUser = useCallback(async (reportedUserId: string, reportedIp: string, reason: string) => {
        return await centrifugoClient.reportUser(reportedUserId, reportedIp, reason);
    }, []);

    const checkBanStatus = useCallback(async (userId?: string, ip?: string) => {
        return await centrifugoClient.checkBanStatus(userId, ip);
    }, []);

    const value = {
        isConnected,
        clientId,
        subscribe,
        publish,
        getPresence,
        sendOffer,
        sendAnswer,
        sendIceCandidate,
        sendNegotiationNeeded,
        sendNegotiationDone,
        sendChatMessage,
        joinRoom,
        leaveRoom,
        findRandomMatch,
        cancelRandomMatch,
        findVoiceMatch,
        cancelVoiceMatch,
        findTextMatch,
        cancelTextMatch,
        getPublicRooms,
        createPublicRoom,
        reportUser,
        checkBanStatus,
        error,
    };

    return (
        <CentrifugoContext.Provider value={value}>
            {children}
        </CentrifugoContext.Provider>
    );
}

export const useCentrifugo = (): CentrifugoContextType => {
    const context = useContext(CentrifugoContext);
    if (context === undefined) {
        throw new Error('useCentrifugo must be used within a CentrifugoProvider');
    }
    return context;
};
