import { Centrifuge, Subscription } from 'centrifuge';
import { v4 as uuidv4 } from 'uuid';

type EventCallback = (data: any) => void;

class CentrifugeClient {
  private client: Centrifuge;
  private subscriptions: Map<string, Subscription> = new Map();
  private eventCallbacks: Map<string, EventCallback[]> = new Map();
  private isConnected: boolean = false;
  public clientId: string = '';
  private userId: string = '';

  constructor(wsUrl: string) {
    // 1. Get or Generate Persistent User ID
    this.userId = this.getOrGenerateUserId();

    this.client = new Centrifuge(wsUrl, {
      token: '', // Will be set via connect()
      getToken: async () => {
        // Pass the persistent userId to the server to generate a secure token
        const response = await fetch(`/api/centrifugo/token?userId=${encodeURIComponent(this.userId)}`);
        const data = await response.json();
        return data.token;
      },
      debug: process.env.NODE_ENV === 'development',
    });

    this.setupEventHandlers();
  }

  private getOrGenerateUserId(): string {
    if (typeof window === 'undefined') return ''; // Server-side fallback

    const STORAGE_KEY = 'whobee_user_id';
    let storedId = localStorage.getItem(STORAGE_KEY);

    if (!storedId) {
      storedId = uuidv4();
      localStorage.setItem(STORAGE_KEY, storedId);
    }

    return storedId;
  }

  private setupEventHandlers() {
    this.client.on('connecting', () => {
      console.log('Connecting to Centrifugo...');
      this.emit('connecting', {});
    });

    this.client.on('connected', (ctx) => {
      console.log('Connected to Centrifugo');
      this.isConnected = true;
      this.clientId = ctx.client || '';
      this.emit('connected', { clientId: this.clientId });
    });

    this.client.on('disconnected', () => {
      console.log('Disconnected from Centrifugo');
      this.isConnected = false;
      this.emit('disconnected', {});
    });

    this.client.on('error', (error: any) => {
      console.error('Centrifugo error:', error);
      this.emit('error', { error });
    });
  }

  connect() {
    this.client.connect();
  }

  disconnect() {
    this.client.disconnect();
  }

  getClientId(): string {
    return this.clientId;
  }

  subscribe(channel: string, callback: EventCallback): () => void {
    if (!this.isConnected) {
      console.warn('Not connected to Centrifugo. Connecting now...');
      this.connect();
    }

    let subscription = this.subscriptions.get(channel);

    // Create subscription only if it doesn't exist
    if (!subscription) {
      subscription = this.client.newSubscription(channel, {
        getToken: async () => {
          const response = await fetch(`/api/centrifugo/subscription-token?channel=${encodeURIComponent(channel)}&userId=${encodeURIComponent(this.userId)}`);
          const data = await response.json();
          return data.token;
        },
      });

      subscription.on('publication', (ctx) => {
        this.emit(channel, ctx.data);
      });

      subscription.on('subscribed', () => {
        console.log(`Subscribed to ${channel}`);
        this.emit(`${channel}:subscribed`, {});
      });

      subscription.on('unsubscribed', () => {
        console.log(`Unsubscribed from ${channel}`);
        this.emit(`${channel}:unsubscribed`, {});
      });

      this.subscriptions.set(channel, subscription);
    }

    // If subscription exists but is unsubscribed, resubscribe
    if (subscription.state === 'unsubscribed') {
      subscription.subscribe();
    }

    this.on(channel, callback);

    // Return unsubscribe function
    return () => {
      this.off(channel, callback);
      if (this.subscriptions.has(channel)) {
        const callbacks = this.eventCallbacks.get(channel) || [];
        if (callbacks.length === 0) {
          const sub = this.subscriptions.get(channel);
          if (sub && sub.state === 'subscribed') {
            sub.unsubscribe();
          }
        }
      }
    };
  }

  async publish(channel: string, data: any) {
    const response = await fetch('/api/centrifugo/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel,
        data,
      }),
    });
    return response.json();
  }

  async getPresence(channel: string) {
    const response = await fetch(`/api/centrifugo/presence?channel=${encodeURIComponent(channel)}`);
    return response.json();
  }

  async getHistory(channel: string, limit: number = 10) {
    const response = await fetch(
      `/api/centrifugo/history?channel=${encodeURIComponent(channel)}&limit=${limit}`
    );
    return response.json();
  }

  // WebRTC Signaling Methods
  async sendOffer(channel: string, to: string, offer: RTCSessionDescriptionInit) {
    await this.publish(channel, {
      type: 'offer',
      from: this.clientId,
      to,
      offer,
    });
  }

  async sendAnswer(channel: string, to: string, answer: RTCSessionDescriptionInit) {
    await this.publish(channel, {
      type: 'answer',
      from: this.clientId,
      to,
      answer,
    });
  }

  async sendIceCandidate(channel: string, to: string, candidate: RTCIceCandidate) {
    await this.publish(channel, {
      type: 'ice-candidate',
      from: this.clientId,
      to,
      candidate,
    });
  }

  async sendNegotiationNeeded(channel: string, to: string, offer: RTCSessionDescriptionInit) {
    await this.publish(channel, {
      type: 'peer-nego-needed',
      from: this.clientId,
      to,
      offer,
    });
  }

  async sendNegotiationDone(channel: string, to: string, answer: RTCSessionDescriptionInit) {
    await this.publish(channel, {
      type: 'peer-nego-done',
      from: this.clientId,
      to,
      answer,
    });
  }

  // Chat Methods
  async sendChatMessage(channel: string, text: string, senderName: string) {
    await this.publish(channel, {
      type: 'chat-message',
      sender: this.clientId,
      senderName,
      text,
      timestamp: Date.now(),
    });
  }

  // Presence Methods
  async joinRoom(roomId: string, userName: string, namespace: string = 'room') {
    const channel = `${namespace}:${roomId}`;
    await this.publish(channel, {
      type: 'user-joined',
      userId: this.clientId,
      userName,
      timestamp: Date.now(),
    });
  }

  async leaveRoom(roomId: string, namespace: string = 'room') {
    const channel = `${namespace}:${roomId}`;
    await this.publish(channel, {
      type: 'user-left',
      userId: this.clientId,
      timestamp: Date.now(),
    });
  }

  // Matching Methods
  async findRandomMatch(preferences?: any): Promise<any> {
    const response = await fetch('/api/matching/join-random', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: this.clientId, preferences }),
    });
    if (response.status === 403 && typeof window !== 'undefined') {
      window.location.href = '/banned';
      return { error: 'banned' };
    }
    return response.json();
  }

  async cancelRandomMatch(): Promise<any> {
    const response = await fetch('/api/matching/join-random', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: this.clientId }),
    });
    return response.json();
  }

  async findVoiceMatch(): Promise<any> {
    const response = await fetch('/api/matching/voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: this.clientId }),
    });
    if (response.status === 403 && typeof window !== 'undefined') {
      window.location.href = '/banned';
      return { error: 'banned' };
    }
    return response.json();
  }

  async cancelVoiceMatch(): Promise<any> {
    const response = await fetch('/api/matching/voice', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: this.clientId }),
    });
    return response.json();
  }

  async findTextMatch(): Promise<any> {
    const response = await fetch('/api/matching/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: this.clientId }),
    });
    if (response.status === 403 && typeof window !== 'undefined') {
      window.location.href = '/banned';
      return { error: 'banned' };
    }
    return response.json();
  }

  async cancelTextMatch(): Promise<any> {
    const response = await fetch('/api/matching/text', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: this.clientId }),
    });
    return response.json();
  }

  // Room Management Methods
  async getPublicRooms(): Promise<any> {
    const response = await fetch('/api/rooms/public');
    return response.json();
  }

  async createPublicRoom(name: string, description: string, creatorName: string): Promise<any> {
    const response = await fetch('/api/rooms/public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description,
        creatorId: this.clientId,
        creatorName,
      }),
    });
    return response.json();
  }

  // Moderation Methods
  async reportUser(reportedUserId: string, reportedIp: string, reason: string): Promise<any> {
    const response = await fetch('/api/moderation/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportedUserId,
        reportedBy: this.clientId,
        reportedIp,
        reason,
      }),
    });
    return response.json();
  }

  async checkBanStatus(userId?: string, ip?: string): Promise<any> {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (ip) params.append('ip', ip);

    const response = await fetch(`/api/moderation/report?${params.toString()}`);
    return response.json();
  }

  // Event emitter methods
  on(event: string, callback: EventCallback) {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event)?.push(callback);
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.eventCallbacks.get(event) || [];
    callbacks.forEach((callback) => callback(data));
  }
}

// Create a singleton instance
export const centrifugoClient = new CentrifugeClient(
  process.env.NEXT_PUBLIC_CENTRIFUGO_WS_URL || 'ws://localhost:8000/connection/websocket'
);

export default centrifugoClient;
