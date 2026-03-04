import * as MediasoupClient from 'mediasoup-client';
import { centrifugoClient } from './centrifuge';

class MediasoupService {
    device: MediasoupClient.types.Device | null = null;
    sendTransport: MediasoupClient.types.Transport | null = null;
    recvTransport: MediasoupClient.types.Transport | null = null;
    producers: Map<string, MediasoupClient.types.Producer> = new Map();
    consumers: Map<string, MediasoupClient.types.Consumer> = new Map();
    roomId: string = '';
    pendingRequests: Map<string, { resolve: (data: any) => void, reject: (err: any) => void }> = new Map();

    constructor() {
        // Listen for SFU responses
        // We assume the client is already subscribed to user channel in CentrifugoProvider
        // But we need to hook into the event stream.
        // Since centrifugoClient is a singleton, we can listen to the user channel here if we know the ID.
        // A better way is to register a callback.

        // For now, we'll rely on the app to pass the response to us, OR we subscribe ourselves.
        // Let's make a setup method.
    }

    async initialize(roomId: string) {
        this.roomId = roomId;
        this.device = new MediasoupClient.Device();

        // Subscribe to user channel for responses
        const userId = centrifugoClient.getClientId();
        const userChannel = `user:${userId}`;

        centrifugoClient.subscribe(userChannel, (data) => {
            if (data.type === 'sfu-response') {
                this.handleResponse(data);
            }
        });

        // 1. Get Router Capabilities
        const routerRtpCapabilities = await this.request('getRouterRtpCapabilities', { roomId });

        // 2. Load Device
        await this.device.load({ routerRtpCapabilities });

        // 3. Create Transports
        await this.createSendTransport();
        await this.createRecvTransport();
    }

    async createSendTransport() {
        const transportInfo = await this.request('createWebRtcTransport', { roomId: this.roomId });

        this.sendTransport = this.device!.createSendTransport(transportInfo);

        this.sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
            try {
                await this.request('connectWebRtcTransport', {
                    roomId: this.roomId,
                    transportId: this.sendTransport!.id,
                    dtlsParameters,
                });
                callback();
            } catch (error) {
                errback(error as Error);
            }
        });

        this.sendTransport.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
            try {
                const { id } = await this.request('produce', {
                    roomId: this.roomId,
                    transportId: this.sendTransport!.id,
                    kind,
                    rtpParameters,
                    appData,
                });
                callback({ id });
            } catch (error) {
                errback(error as Error);
            }
        });
    }

    async createRecvTransport() {
        const transportInfo = await this.request('createWebRtcTransport', { roomId: this.roomId });

        this.recvTransport = this.device!.createRecvTransport(transportInfo);

        this.recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
            try {
                await this.request('connectWebRtcTransport', {
                    roomId: this.roomId,
                    transportId: this.recvTransport!.id,
                    dtlsParameters,
                });
                callback();
            } catch (error) {
                errback(error as Error);
            }
        });
    }

    async produce(track: MediaStreamTrack) {
        if (!this.sendTransport) throw new Error('Send transport not created');

        const producer = await this.sendTransport.produce({ track });
        this.producers.set(producer.id, producer);
        return producer;
    }

    async consume(producerId: string) {
        if (!this.recvTransport) throw new Error('Recv transport not created');

        const { rtpCapabilities } = this.device!;

        const data = await this.request('consume', {
            roomId: this.roomId,
            transportId: this.recvTransport.id,
            producerId,
            rtpCapabilities,
        });

        const consumer = await this.recvTransport.consume({
            id: data.id,
            producerId: data.producerId,
            kind: data.kind,
            rtpParameters: data.rtpParameters,
        });

        this.consumers.set(consumer.id, consumer);

        // Resume consumer (it starts paused server-side)
        await this.request('resume', { roomId: this.roomId, consumerId: consumer.id });

        return consumer;
    }

    // Signaling Helper
    private request(type: string, payload: any = {}): Promise<any> {
        return new Promise((resolve, reject) => {
            const reqId = Math.random().toString(36).substring(7);
            this.pendingRequests.set(reqId, { resolve, reject });

            const peerId = centrifugoClient.getClientId();

            centrifugoClient.publish('sfu:signaling', {
                type,
                roomId: this.roomId,
                peerId,
                reqId,
                payload
            }).catch(err => {
                this.pendingRequests.delete(reqId);
                reject(err);
            });

            // Timeout
            setTimeout(() => {
                if (this.pendingRequests.has(reqId)) {
                    this.pendingRequests.delete(reqId);
                    reject(new Error('Request timeout'));
                }
            }, 10000);
        });
    }

    private handleResponse(response: any) {
        const { reqId, data, error, success } = response;
        const request = this.pendingRequests.get(reqId);

        if (request) {
            if (error) {
                request.reject(new Error(error));
            } else {
                request.resolve(data || success);
            }
            this.pendingRequests.delete(reqId);
        }
    }
}

export const mediasoupService = new MediasoupService();
export default mediasoupService;
