// MIGRATED FROM SOCKET.IO TO CENTRIFUGO
// Original file backed up in socket-io-backup/src/components/public-room/chat.tsx
// Migration date: 2025-11-22T15:36:04.943Z

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { PublicRoomMessage } from '@/types/public-room';
import { Send, Smile, Paperclip } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';




interface ChatProps {
  messages: PublicRoomMessage[];
  onSendMessage: (text: string) => void;
  className?: string;
}


export function Chat({ messages, onSendMessage, className }: ChatProps) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    onSendMessage(message.trim());
    setMessage('');
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={cn('flex flex-col h-full bg-white/50 backdrop-blur-sm rounded-none md:rounded-xl overflow-hidden', className)}>
      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 mt-10 opacity-70">
              <Smile className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">Say hello! Break the ice.</p>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex flex-col max-w-[85%]',
                msg.senderId === 'system' ? 'mx-auto' : '',
                msg.senderId !== 'system' && !msg.senderId.startsWith('system-') ?
                  (msg.senderId === 'me' ? 'ml-auto items-end' : 'mr-auto items-start')
                  : ''
              )}
            >
              {msg.senderId !== 'system' && !msg.senderId.startsWith('system-') && (
                <span className="text-[10px] text-gray-500 mb-1 px-1">
                  {msg.sender}
                </span>
              )}
              <div
                className={cn(
                  'rounded-2xl px-4 py-2.5 text-sm shadow-sm break-words',
                  msg.type === 'system' || msg.senderId === 'system' || msg.senderId.startsWith('system-')
                    ? 'bg-gray-100 text-gray-500 text-center text-xs py-1 rounded-full px-3 mx-auto border border-gray-200'
                    : msg.senderId === 'me'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-none'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                )}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-gray-400 mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message input */}
      <form onSubmit={handleSubmit} className="p-3 bg-white/80 border-t border-gray-100">
        <div className="relative flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-full border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all pl-4 pr-12 h-11"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="absolute right-1.5 top-1.5 h-8 w-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Send className="h-4 w-4 ml-0.5" />
          </button>
        </div>
      </form>
    </div>
  );
}

