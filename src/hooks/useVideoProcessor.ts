import { useEffect, useRef, useState } from 'react';

// Type definitions for Insertable Streams API
declare global {
    class MediaStreamTrackProcessor {
        constructor(init: { track: MediaStreamTrack });
        readable: ReadableStream;
    }
    class MediaStreamTrackGenerator extends MediaStreamTrack {
        constructor(init: { kind: 'audio' | 'video' });
        writable: WritableStream;
    }
}

export function useVideoProcessor(rawStream: MediaStream | null) {
    const [processedStream, setProcessedStream] = useState<MediaStream | null>(null);
    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined' || !rawStream) return;

        // Feature detection for Insertable Streams
        if (!('MediaStreamTrackProcessor' in window)) {
            console.warn("Insertable Streams not supported in this browser. Fallback or error handling needed.");
            // For now, we return the raw stream or look for a fallback if requested.
            // But the user explicitly asked for this "Enterprise" solution.
            setProcessedStream(rawStream);
            return;
        }

        try {
            // 1. Setup the Worker
            workerRef.current = new Worker('/blur-worker.js');

            // 2. Get the video track
            const videoTrack = rawStream.getVideoTracks()[0];
            if (!videoTrack) {
                console.error("No video track found in stream");
                setProcessedStream(rawStream);
                return;
            }

            // 3. Create the "Insertable Streams" (Breakout Box)
            const processor = new MediaStreamTrackProcessor({ track: videoTrack });
            const generator = new MediaStreamTrackGenerator({ kind: 'video' });

            // 4. Transfer streams to the Worker (Zero copy!)
            workerRef.current.postMessage(
                {
                    type: 'STREAM',
                    readable: processor.readable,
                    writable: generator.writable,
                },
                [processor.readable, generator.writable]
            );

            // 5. Create a new MediaStream with the processed track
            // We also want to preserve audio tracks if any
            const audioTracks = rawStream.getAudioTracks();
            const newStream = new MediaStream([generator, ...audioTracks]);

            setProcessedStream(newStream);
        } catch (err) {
            console.error("Error initializing video processor:", err);
            setProcessedStream(rawStream); // Fallback
        }

        return () => {
            workerRef.current?.terminate();
        };
    }, [rawStream]);

    // Function to update blur level
    const setBlurLevel = (level: number) => {
        workerRef.current?.postMessage({ type: 'SET_BLUR', value: level });
    };

    return { processedStream, setBlurLevel };
}
