import { useState, useRef, useCallback } from 'react';

export const useReactionRecorder = (localStream: MediaStream | null, remoteStream: MediaStream | null) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const animationFrameRef = useRef<number>(0);
    const audioContextRef = useRef<AudioContext | null>(null);
    const isRevealedRef = useRef(false);

    const triggerRevealInRecording = useCallback(() => {
        isRevealedRef.current = true;
    }, []);

    const startRecording = useCallback(async () => {
        if (!localStream || !remoteStream) {
            console.warn("Both local and remote streams are required to record.");
            return;
        }

        chunksRef.current = [];
        setRecordedVideoUrl(null);
        setRecordedBlob(null);
        isRevealedRef.current = false;

        // 1. Create hidden videos to read frames from
        const localVideo = document.createElement('video');
        localVideo.srcObject = localStream;
        localVideo.muted = true;
        localVideo.playsInline = true;
        await localVideo.play().catch(e => console.error("Error playing local video for recording", e));

        const remoteVideo = document.createElement('video');
        remoteVideo.srcObject = remoteStream;
        remoteVideo.muted = true;
        remoteVideo.playsInline = true;
        await remoteVideo.play().catch(e => console.error("Error playing remote video for recording", e));

        // 2. Setup Canvas
        const canvas = document.createElement('canvas');
        canvas.width = 720;
        canvas.height = 1280;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        // 3. Audio Mixing
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const dest = audioContextRef.current.createMediaStreamDestination();

        // Local audio
        if (localStream.getAudioTracks().length > 0) {
            const localSource = audioContextRef.current.createMediaStreamSource(new MediaStream([localStream.getAudioTracks()[0]]));
            localSource.connect(dest);
        }

        // Remote audio
        if (remoteStream.getAudioTracks().length > 0) {
            const remoteSource = audioContextRef.current.createMediaStreamSource(new MediaStream([remoteStream.getAudioTracks()[0]]));
            remoteSource.connect(dest);
        }

        // 4. Draw loop
        const drawFrame = () => {
            // Clear background
            ctx.fillStyle = '#1e293b'; // slate-800
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Helper to draw covered/cropped video
            const drawVideoCropped = (v: HTMLVideoElement, x: number, y: number, w: number, h: number) => {
                if (v.readyState < 2) return;
                const videoRatio = v.videoWidth / v.videoHeight;
                const boxRatio = w / h;

                let drawW = w;
                let drawH = h;
                let drawX = x;
                let drawY = y;

                if (videoRatio > boxRatio) {
                    // Video is wider than box -> crop left/right
                    const scaledWidth = h * videoRatio;
                    drawW = scaledWidth;
                    drawX = x - (scaledWidth - w) / 2;
                } else {
                    // Video is taller than box -> crop top/bottom
                    const scaledHeight = w / videoRatio;
                    drawH = scaledHeight;
                    drawY = y - (scaledHeight - h) / 2;
                }

                // Clip region
                ctx.save();
                ctx.beginPath();
                ctx.rect(x, y, w, h);
                ctx.clip();

                ctx.drawImage(v, drawX, drawY, drawW, drawH);
                ctx.restore();
            };

            // Top half: Remote
            if (!isRevealedRef.current) {
                ctx.filter = 'blur(40px)';
            } else {
                ctx.filter = 'none';
            }
            drawVideoCropped(remoteVideo, 0, 0, 720, 640);

            // Bottom half: Local (never blurred)
            ctx.filter = 'none';
            drawVideoCropped(localVideo, 0, 640, 720, 640);

            // Add dividing line
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 638, 720, 4);

            // Add Watermark
            ctx.font = 'bold 36px sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 4;
            ctx.fillText('WHOBEE', 20, 50);

            animationFrameRef.current = requestAnimationFrame(drawFrame);
        };

        drawFrame();

        // 5. Capture Stream
        const canvasStream = canvas.captureStream(30);
        const combinedStream = new MediaStream([
            ...canvasStream.getVideoTracks(),
            ...dest.stream.getAudioTracks()
        ]);

        // 6. Start Recording
        let mimeType = 'video/webm;codecs=vp8,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/mp4'; // fallback for Safari
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = ''; // Let browser choose
            }
        }

        try {
            const recorder = new MediaRecorder(combinedStream, mimeType ? { mimeType } : undefined);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType || 'video/mp4' });
                setRecordedBlob(blob);
                setRecordedVideoUrl(URL.createObjectURL(blob));

                // Cleanup visually
                if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
                localVideo.pause();
                localVideo.srcObject = null;
                remoteVideo.pause();
                remoteVideo.srcObject = null;
                if (audioContextRef.current) audioContextRef.current.close().catch(console.error);
            };

            recorder.start(100); // collect 100ms chunks
            setIsRecording(true);
        } catch (e) {
            console.error("Failed to start MediaRecorder", e);
        }

    }, [localStream, remoteStream]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, []);

    const shareVideo = useCallback(async () => {
        if (!recordedBlob) return;
        const file = new File([recordedBlob], 'whobee-reaction.mp4', { type: recordedBlob.type });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    title: 'My WHOBEE Reaction!',
                    text: 'Check out this hilarious reaction on WHOBEE! 😂',
                    files: [file]
                });
                return true;
            } catch (e) {
                console.error("Error sharing:", e);
                return false; // User cancelled or failed
            }
        } else {
            downloadVideo();
            return false;
        }
    }, [recordedBlob]);

    const downloadVideo = useCallback(() => {
        if (!recordedVideoUrl) return;
        const a = document.createElement('a');
        a.href = recordedVideoUrl;
        a.download = 'whobee-reaction.mp4';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }, [recordedVideoUrl]);

    const clearRecording = useCallback(() => {
        if (recordedVideoUrl) {
            URL.revokeObjectURL(recordedVideoUrl);
        }
        setRecordedVideoUrl(null);
        setRecordedBlob(null);
    }, [recordedVideoUrl]);

    return {
        isRecording,
        recordedVideoUrl,
        startRecording,
        stopRecording,
        triggerRevealInRecording,
        shareVideo,
        downloadVideo,
        clearRecording
    };
};
