import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { PublicRoomParticipant } from '@/types/public-room';
import { Mic, MicOff, User, Video, VideoOff } from 'lucide-react';

type ParticipantsListProps = {
  participants: PublicRoomParticipant[];
  className?: string;
};

export function ParticipantsList({ participants, className }: ParticipantsListProps) {
  return (
    <div className={cn('bg-card rounded-xl border h-full flex flex-col', className)}>
      <div className="p-4 border-b">
        <h3 className="font-semibold">Participants ({participants.length})</h3>
      </div>
      
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className={cn(
                'flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors',
                participant.isSpeaking && 'bg-primary/10'
              )}
            >
              <Avatar className="h-10 w-10">
                {participant.avatar ? (
                  <AvatarImage src={participant.avatar} alt={participant.name} />
                ) : (
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {participant.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {participant.name}
                  {participant.isMe && (
                    <span className="text-muted-foreground text-xs ml-1">(You)</span>
                  )}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex items-center gap-1">
                    {participant.audioEnabled ? (
                      <Mic className="h-3 w-3 text-green-500" />
                    ) : (
                      <MicOff className="h-3 w-3 text-destructive" />
                    )}
                    {participant.videoEnabled ? (
                      <Video className="h-3 w-3 text-green-500" />
                    ) : (
                      <VideoOff className="h-3 w-3 text-destructive" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(participant.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              
              {participant.isSpeaking && (
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              )}
            </div>
          ))}
          
          {participants.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No participants yet
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
