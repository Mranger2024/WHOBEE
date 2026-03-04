// MIGRATED FROM SOCKET.IO TO CENTRIFUGO
// Original file backed up in socket-io-backup/src/components/ui/group-chat-box.tsx
// Migration date: 2026-02-03T17:34:00.031Z

"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Users, MoreVertical, Smile } from 'lucide-react';
import { useCentrifugo } from '@/context/CentrifugoProvider';


interface GroupMessage {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: Date;
    type: 'text' | 'system' | 'join' | 'leave';
}

interface Participant {
    id: string;
    name: string;
    avatar?: string;
    isOnline: boolean;
    joinedAt: Date;
}

interface GroupChatBoxProps {
    roomId: string;
    userId: string;
    userName: string;
    participants: Participant[];
}

// Global store for group messages and unread counts
const groupMessageStore: Record<string, GroupMessage[]> = {};
let groupUnreadCount: Record<string, number> = {};

// Function to update notification badges for group chat
const updateGroupNotificationBadges = (roomId: string, count: number) => {
    setTimeout(() => {
        try {
            const badges = document.querySelectorAll('#chat-notification-badge');

            if (badges.length === 0) {
                console.log('No group chat notification badges found in DOM');
                return;
            }

            badges.forEach(badge => {
                const badgeElement = badge as HTMLElement;

                if (count > 0) {
                    badge.textContent = count > 9 ? '9+' : count.toString();
                    badgeElement.style.display = 'flex';
                    badgeElement.style.backgroundColor = '#ef4444';
                    badgeElement.style.color = 'white';
                    badgeElement.style.fontWeight = 'bold';
                } else {
                    badgeElement.style.display = 'none';
                }
            });

            console.log(`Updated ${badges.length} group chat notification badges with count: ${count}`);
        } catch (error) {
            console.error('Error updating group chat notification badges:', error);
        }
    }, 200);
};

export function GroupChatBox({ roomId, userId, userName, participants }: GroupChatBoxProps) {
    const { clientId, subscribe, publish } = useCentrifugo();
    // Initialize message store for this room
    if (!groupMessageStore[roomId]) {
        groupMessageStore[roomId] = [];
    }
    if (groupUnreadCount[roomId] === undefined) {
        groupUnreadCount[roomId] = 0;
    }

    const [messages, setMessages] = useState<GroupMessage[]>(groupMessageStore[roomId]);
    const [newMessage, setNewMessage] = useState('');
    const [unreadCount, setUnreadCount] = useState(groupUnreadCount[roomId]);
    const [isTyping, setIsTyping] = useState<string[]>([]);
    const [showParticipants, setShowParticipants] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const isVisible = useRef(true);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // Handle visibility change
    useEffect(() => {
        const handleVisibilityChange = () => {
            isVisible.current = !document.hidden;
            if (isVisible.current && groupUnreadCount[roomId] > 0) {
                groupUnreadCount[roomId] = 0;
                setUnreadCount(0);
                updateGroupNotificationBadges(roomId, 0);
            }
        };

        const handleFocus = () => {
            isVisible.current = true;
            if (groupUnreadCount[roomId] > 0) {
                groupUnreadCount[roomId] = 0;
                setUnreadCount(0);
                updateGroupNotificationBadges(roomId, 0);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [roomId]);

    // Centrifugo event handlers
    useEffect(() => {
        if (!roomId || !clientId) return;

        const groupChannel = `group:${roomId}`;
        console.log('GroupChatBox: Setting up subscription to', groupChannel);

        const subscription = subscribe(groupChannel, (data) => {
            console.log('GroupChatBox received message:', data);

            switch (data.type) {
                case 'chat-message':
                    const newMsg: GroupMessage = {
                        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        senderId: data.senderId,
                        senderName: data.senderName,
                        text: data.text,
                        timestamp: new Date(),
                        type: 'text'
                    };

                    groupMessageStore[roomId] = [...groupMessageStore[roomId], newMsg];
                    setMessages(groupMessageStore[roomId]);

                    // Update unread count if message is from someone else
                    if (data.senderId !== userId) {
                        groupUnreadCount[roomId] = (groupUnreadCount[roomId] || 0) + 1;
                        setUnreadCount(groupUnreadCount[roomId]);
                        updateGroupNotificationBadges(roomId, groupUnreadCount[roomId]);

                        // Browser notification
                        if (!isVisible.current && "Notification" in window && Notification.permission === "granted") {
                            new Notification(`New message from ${data.senderName}`, {
                                body: data.text,
                                icon: '/favicon.ico'
                            });
                        }
                    }

                    scrollToBottom();
                    break;

                case 'user-typing':
                    if (data.userId !== userId) {
                        setIsTyping(prev => {
                            if (data.isTyping) {
                                return prev.includes(data.userName) ? prev : [...prev, data.userName];
                            } else {
                                return prev.filter(name => name !== data.userName);
                            }
                        });
                    }
                    break;

                case 'participant-joined':
                    if (data.id !== userId) {
                        const joinMsg: GroupMessage = {
                            id: `join-${Date.now()}`,
                            senderId: 'system',
                            senderName: 'System',
                            text: `${data.name} joined the chat`,
                            timestamp: new Date(),
                            type: 'join'
                        };

                        groupMessageStore[roomId] = [...groupMessageStore[roomId], joinMsg];
                        setMessages(groupMessageStore[roomId]);
                        scrollToBottom();
                    }
                    break;

                case 'participant-left':
                    const leaveMsg: GroupMessage = {
                        id: `leave-${Date.now()}`,
                        senderId: 'system',
                        senderName: 'System',
                        text: `${data.name || 'A user'} left the chat`,
                        timestamp: new Date(),
                        type: 'leave'
                    };

                    groupMessageStore[roomId] = [...groupMessageStore[roomId], leaveMsg];
                    setMessages(groupMessageStore[roomId]);
                    scrollToBottom();
                    break;
            }
        });

        return () => {
            if (subscription) subscription();
        };
    }, [roomId, clientId, userId, subscribe, scrollToBottom]);

    // Request notification permission
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    // Send message
    const sendMessage = useCallback(() => {
        if (!newMessage.trim() || !roomId) return;

        publish(`group:${roomId}`, {
            type: 'chat-message',
            senderId: userId,
            senderName: userName,
            text: newMessage.trim()
        });

        setNewMessage('');

        // Stop typing indicator
        publish(`group:${roomId}`, {
            type: 'user-typing',
            userId,
            userName,
            isTyping: false
        });
    }, [newMessage, publish, roomId, userId, userName]);

    // Handle typing
    const handleTyping = useCallback(() => {
        if (!roomId) return;

        publish(`group:${roomId}`, {
            type: 'user-typing',
            userId,
            userName,
            isTyping: true
        });

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            publish(`group:${roomId}`, {
                type: 'user-typing',
                userId,
                userName,
                isTyping: false
            });
        }, 1000);
    }, [publish, roomId, userId, userName]);

    // Get participant info
    const getParticipantInfo = (senderId: string) => {
        if (senderId === userId) return { name: userName, avatar: null };
        const participant = participants.find(participant => participant.id === senderId);
        return participant ? { name: participant.name, avatar: participant.avatar } : { name: 'Unknown User', avatar: null };
    };

    // Format timestamp
    const formatTime = (timestamp: Date) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Get message style based on type
    const getMessageStyle = (message: GroupMessage) => {
        switch (message.type) {
            case 'system':
            case 'join':
            case 'leave':
                return 'text-center text-sm text-gray-500 italic py-2';
            default:
                return '';
        }
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
            {/* Header */}
            <div className="p-4 border-b bg-gradient-to-r from-orange-500 to-amber-500 rounded-t-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-white">Group Chat</h3>
                        <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                            {participants.length + 1} participants
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                        onClick={() => setShowParticipants(!showParticipants)}
                    >
                        <Users className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Participants Panel */}
            {showParticipants && (
                <div className="p-3 border-b bg-gray-50 max-h-32 overflow-y-auto">
                    <div className="space-y-2">
                        {/* Current user */}
                        <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                                    {userName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{userName} (You)</span>
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>

                        {/* Other participants */}
                        {participants.map((participant) => (
                            <div key={participant.id} className="flex items-center space-x-2">
                                <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                                        {participant.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{participant.name}</span>
                                <div className={`w-2 h-2 rounded-full ${participant.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.map((message) => (
                        <div key={message.id} className={getMessageStyle(message)}>
                            {message.type === 'text' ? (
                                <div className={`flex ${message.senderId === userId ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.senderId === userId
                                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                                        : 'bg-gray-100 text-gray-900'
                                        }`}>
                                        {message.senderId !== userId && (
                                            <div className="text-xs font-medium mb-1 opacity-70">
                                                {getParticipantInfo(message.senderId).name}
                                            </div>
                                        )}
                                        <div className="text-sm">{message.text}</div>
                                        <div className={`text-xs mt-1 ${message.senderId === userId ? 'text-white/70' : 'text-gray-500'
                                            }`}>
                                            {formatTime(message.timestamp)}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-sm text-gray-500 py-2">
                                    {message.text}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Typing indicators */}
                    {isTyping.length > 0 && (
                        <div className="flex justify-start">
                            <div className="bg-gray-100 px-4 py-2 rounded-lg">
                                <div className="text-sm text-gray-600">
                                    {isTyping.length === 1
                                        ? `${isTyping[0]} is typing...`
                                        : `${isTyping.slice(0, -1).join(', ')} and ${isTyping[isTyping.length - 1]} are typing...`
                                    }
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t">
                <div className="flex space-x-2">
                    <Input
                        ref={inputRef}
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => {
                            setNewMessage(e.target.value);
                            handleTyping();
                        }}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                sendMessage();
                            }
                        }}
                        className="flex-1"
                    />
                    <Button
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                        className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
