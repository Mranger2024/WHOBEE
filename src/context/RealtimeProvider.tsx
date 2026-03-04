'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { centrifugoClient } from '@/lib/centrifuge';

type Message = {
  id: string;
  sender: string;
  senderName: string;
  text: string;
  timestamp: Date;
  type?: string;
};

type RealtimeContextType = {
  // Connection state
  isConnected: boolean;
  client: any; // Centrifuge client instance
  
  // Chat functionality
  sendMessage: (message: string, roomId: string, senderName?: string) => Promise<void>;
  joinRoom: (roomId: string, userId: string, userName: string) => Promise<() => void>;
  leaveRoom: (roomId: string, userId: string) => Promise<void>;
  messages: Record<string, Message[]>;
  onlineUsers: Record<string, number>;
  
  // WebRTC signaling
  publish: (channel: string, data: any) => Promise<void>;
  subscribe: (channel: string, handler: (data: any) => void) => () => void;
  
  // User management
  currentUser: { id: string; name: string } | null;
  error: Error | null;
};

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [onlineUsers, setOnlineUsers] = useState<Record<string, number>>({});
  const [error, setError] = useState<Error | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
  const [subscriptions, setSubscriptions] = useState<Record<string, () => void>>({});

  // Connect to Centrifugo when component mounts
  useEffect(() => {
    const handleConnected = () => {
      console.log('Connected to Centrifugo');
      setIsConnected(true);
      setError(null);
    };

    const handleDisconnected = () => {
      console.log('Disconnected from Centrifugo');
      setIsConnected(false);
    };

    const handleError = (error: any) => {
      console.error('Centrifugo error:', error);
      setError(error instanceof Error ? error : new Error(String(error)));
    };

    // Connect to Centrifugo
    centrifugoClient.connect();

    // Set up event listeners
    centrifugoClient.on('connected', handleConnected);
    centrifugoClient.on('disconnected', handleDisconnected);
    centrifugoClient.on('error', handleError);

    // Clean up on unmount
    return () => {
      // Unsubscribe from all rooms
      Object.values(subscriptions).forEach(unsubscribe => unsubscribe());
      
      // Remove event listeners
      centrifugoClient.off('connected', handleConnected);
      centrifugoClient.off('disconnected', handleDisconnected);
      centrifugoClient.off('error', handleError);
      
      // Disconnect
      centrifugoClient.disconnect();
    };
  }, [subscriptions]);

  // Handle incoming messages
  const handleMessage = useCallback((roomId: string, data: any) => {
    console.log('Received message:', { roomId, data });
    
    if (data.type === 'chat-message') {
      setMessages(prev => ({
        ...prev,
        [roomId]: [
          ...(prev[roomId] || []),
          {
            id: data.id || Date.now().toString(),
            sender: data.senderId,
            senderName: data.senderName || 'Unknown',
            text: data.text,
            timestamp: new Date(data.timestamp || Date.now()),
            type: 'chat-message',
          },
        ],
      }));
    } else if (data.type === 'user-joined' || data.type === 'user-left') {
      updateOnlineUsers(roomId);
    }
  }, []);

  // Update online users count for a room
  const updateOnlineUsers = useCallback(async (roomId: string) => {
    try {
      const presence = await centrifugoClient.getPresence(`room:${roomId}`);
      setOnlineUsers(prev => ({
        ...prev,
        [roomId]: presence.result?.num_clients || 0,
      }));
    } catch (error) {
      console.error('Error updating online users:', error);
    }
  }, []);

  // Join a room
  const joinRoom = useCallback(async (roomId: string, userId: string, userName: string) => {
    if (subscriptions[roomId]) {
      console.log('Already subscribed to room:', roomId);
      return () => {}; // Return empty cleanup function
    }

    console.log('Joining room:', { roomId, userId, userName });
    
    // Set current user
    setCurrentUser({ id: userId, name: userName });

    // Subscribe to room channel
    const onMessage = (data: any) => handleMessage(roomId, data);
    const unsubscribe = centrifugoClient.subscribe(`room:${roomId}`, onMessage);

    // Store the unsubscribe function
    setSubscriptions(prev => ({
      ...prev,
      [roomId]: () => {
        console.log('Unsubscribing from room:', roomId);
        unsubscribe();
        setSubscriptions(prev => {
          const newSubs = { ...prev };
          delete newSubs[roomId];
          return newSubs;
        });
      },
    }));

    // Initial presence update
    await updateOnlineUsers(roomId);

    // Notify others that we've joined
    await centrifugoClient.publish(`room:${roomId}`, {
      type: 'user-joined',
      userId,
      userName,
      timestamp: Date.now(),
    });

    // Load message history
    const loadHistory = async () => {
      try {
        const history = await centrifugoClient.getHistory(`room:${roomId}`, 50);
        if (history?.result?.publications) {
          const newMessages = [...(messages[roomId] || [])];
          
          history.result.publications.forEach((pub: any) => {
            if (pub.data?.type === 'chat-message') {
              newMessages.push({
                id: pub.data.id || pub.uid,
                sender: pub.data.senderId,
                senderName: pub.data.senderName || 'Unknown',
                text: pub.data.text,
                timestamp: new Date(pub.data.timestamp || pub.offset),
                type: 'chat-message',
              });
            }
          });
          
          // Sort messages by timestamp
          newMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
          
          setMessages(prev => ({
            ...prev,
            [roomId]: newMessages,
          }));
        }
      } catch (error) {
        console.error('Error loading message history:', error);
      }
    };

    await loadHistory();

    // Return cleanup function
    return () => {
      console.log('Leaving room cleanup:', roomId);
      if (subscriptions[roomId]) {
        subscriptions[roomId]();
      }
    };
  }, [handleMessage, subscriptions, updateOnlineUsers, messages]);

  // Leave a room
  const leaveRoom = useCallback(async (roomId: string, userId: string) => {
    if (!subscriptions[roomId]) return;

    console.log('Leaving room:', { roomId, userId });

    // Notify others that we're leaving
    try {
      await centrifugoClient.publish(`room:${roomId}`, {
        type: 'user-left',
        userId,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error notifying user left:', error);
    }

    // Unsubscribe from the room
    if (subscriptions[roomId]) {
      subscriptions[roomId]();
    }
  }, [subscriptions]);

  // Publish a message to a channel
  const publish = useCallback(async (channel: string, data: any) => {
    try {
      await centrifugoClient.publish(channel, data);
    } catch (error) {
      console.error('Error publishing message:', error);
      throw error;
    }
  }, []);

  // Subscribe to a channel
  const subscribe = useCallback((channel: string, handler: (data: any) => void) => {
    // The subscribe method returns an unsubscribe function
    const unsubscribe = centrifugoClient.subscribe(channel, (data) => {
      handler(data);
    });
    
    // Return the cleanup function
    return () => {
      unsubscribe();
    };
  }, []);

  // Send a message to a room
  const sendMessage = useCallback(
    async (text: string, roomId: string, senderName: string = 'User') => {
      if (!text.trim()) return;
      if (!currentUser) {
        console.error('Cannot send message: No current user');
        return;
      }

      const message = {
        id: Date.now().toString(),
        type: 'chat-message',
        text,
        senderId: currentUser.id,
        senderName,
        timestamp: Date.now(),
      };

      console.log('Sending message:', { roomId, message });

      try {
        await centrifugoClient.publish(`room:${roomId}`, message);
        
        // Update local state optimistically
        setMessages(prev => ({
          ...prev,
          [roomId]: [
            ...(prev[roomId] || []),
            {
              ...message,
              sender: message.senderId,
              timestamp: new Date(message.timestamp),
            },
          ],
        }));
      } catch (error) {
        console.error('Error sending message:', error);
        throw error;
      }
    },
    [currentUser]
  );

  const value = {
    isConnected,
    client: centrifugoClient,
    sendMessage,
    joinRoom,
    leaveRoom,
    messages,
    onlineUsers,
    error,
    currentUser,
    publish,
    subscribe,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export const useRealtime = (): RealtimeContextType => {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};
