// MIGRATED FROM SOCKET.IO TO CENTRIFUGO
// Original file backed up in socket-io-backup/src/components/ui/chat-box.tsx
// Migration date: 2026-02-03T17:34:00.023Z

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCentrifugo } from '@/context/CentrifugoProvider';


interface Message {
    id: string;
    text: string;
    sender: 'me' | 'stranger' | 'system';
    timestamp: Date;
}

interface ChatBoxProps {
    roomId: string;
    userId: string;
    remoteSocketId: string | null;
    renderFooter?: React.ReactNode;
    onClose?: () => void;
}

export function ChatBox({ roomId, userId, remoteSocketId, renderFooter, onClose }: ChatBoxProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { publish, subscribe, isConnected } = useCentrifugo();

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Subscribe to chat messages
    useEffect(() => {
        if (!roomId || !isConnected) return;

        const handleMessage = (data: any) => {
            if (data.type === 'chat-message' && data.from !== userId) {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    text: data.text,
                    sender: 'stranger',
                    timestamp: new Date()
                }]);
            }
        };

        const unsubscribe = subscribe(roomId, handleMessage);

        return () => {
            unsubscribe();
        };
    }, [roomId, userId, isConnected, subscribe]);

    const handleSend = () => {
        if (!inputValue.trim() || !remoteSocketId || !isConnected) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            text: inputValue.trim(),
            sender: 'me',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newMessage]);

        publish(roomId, {
            type: 'chat-message',
            text: inputValue.trim(),
            from: userId,
            to: remoteSocketId
        });

        setInputValue('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-4 flex items-center justify-between">
                <h3 className="text-white font-semibold">Chat</h3>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-white hover:text-gray-200 transition-colors"
                        aria-label="Close chat"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                    {messages.length === 0 && (
                        <div className="text-center text-gray-400 text-sm py-8">
                            No messages yet. Start the conversation!
                        </div>
                    )}
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[75%] rounded-lg px-4 py-2 ${msg.sender === 'me'
                                        ? 'bg-amber-500 text-white'
                                        : msg.sender === 'system'
                                            ? 'bg-gray-100 text-gray-600 text-sm'
                                            : 'bg-gray-200 text-gray-800'
                                    }`}
                            >
                                <p className="text-sm">{msg.text}</p>
                                <span className="text-xs opacity-70 mt-1 block">
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            {/* Input or Custom Footer */}
            {renderFooter ? (
                <div>{renderFooter}</div>
            ) : (
                <div className="border-t border-gray-200 p-4">
                    <div className="flex gap-2">
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type a message..."
                            className="flex-1"
                            disabled={!remoteSocketId}
                        />
                        <Button
                            onClick={handleSend}
                            disabled={!inputValue.trim() || !remoteSocketId}
                            className="bg-amber-500 hover:bg-amber-600"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
