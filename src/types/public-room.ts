export interface PublicRoomParticipant {
  id: string;
  name: string;
  avatar?: string;
  joinedAt: Date;
  audioEnabled: boolean;
  videoEnabled: boolean;
  isSpeaking: boolean;
  isMe: boolean;
  stream?: MediaStream;
}

export interface PublicRoomMessage {
  id: string;
  sender: string;
  senderId: string;
  text: string;
  timestamp: Date;
  type: 'text' | 'system' | 'join' | 'leave';
}

export interface PublicRoomInfo {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  maxParticipants: number;
}
