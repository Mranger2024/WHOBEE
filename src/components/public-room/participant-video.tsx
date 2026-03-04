import { cn } from '@/lib/utils';
import { PublicRoomParticipant } from '@/types/public-room';
import { Mic, MicOff, User, Video, VideoOff } from 'lucide-react';
import { useEffect, useRef } from 'react';

export function ParticipantVideo({
  participant,
  isLarge = false,
  className = '',
  showVideoWhenDisabled = false,
}: {
  participant: PublicRoomParticipant;
  isLarge?: boolean;
  className?: string;
  showVideoWhenDisabled?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!participant.stream) return;

    if (videoRef.current && (participant.videoEnabled || (participant.isMe && showVideoWhenDisabled))) {
      videoRef.current.srcObject = participant.stream;
      videoRef.current.muted = participant.isMe;
    }

    if (audioRef.current && participant.audioEnabled) {
      audioRef.current.srcObject = participant.stream;
      audioRef.current.muted = participant.isMe;
      audioRef.current.volume = 0.3; // Lower volume for other participants
    }
  }, [participant, showVideoWhenDisabled]);

  return (
    <div
      className={cn(
        'relative rounded-xl overflow-hidden bg-muted/20 border border-border/20 group',
        isLarge ? 'w-full aspect-video' : 'w-48 aspect-video',
        participant.isSpeaking && 'ring-2 ring-primary ring-offset-2',
        className
      )}
    >
      {/* Video element - always show for local participant, conditional for others */}
      {participant.videoEnabled || (participant.isMe && showVideoWhenDisabled) ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={cn(
            'w-full h-full object-cover',
            !participant.videoEnabled && 'opacity-0' // Hide video visually when disabled but keep element
          )}
        />
      ) : (
        <div className="w-full h-full bg-muted/50 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>
      )}

      {/* Audio element */}
      <audio ref={audioRef} autoPlay playsInline className="hidden" />

      {/* Participant info overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {participant.name} {participant.isMe && '(You)'}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {participant.audioEnabled ? (
              <Mic className="h-4 w-4 text-green-500" />
            ) : (
              <MicOff className="h-4 w-4 text-destructive" />
            )}
            {participant.videoEnabled ? (
              <Video className="h-4 w-4 text-green-500" />
            ) : (
              <VideoOff className="h-4 w-4 text-destructive" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
