"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260715_090628_7052d8a6-a094-4341-a4a2-ad58493a67a9.mp4";

const MAX_CAPTURE_WIDTH = 960;
const FPS = 30;
const FRAME_INTERVAL = 1000 / FPS;

// Extend HTMLVideoElement to cleanly support requestVideoFrameCallback if needed
type VideoElementWithRVFC = HTMLVideoElement & {
  requestVideoFrameCallback?: (
    callback: (now: DOMHighResTimeStamp, metadata: unknown) => void
  ) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

export default function BoomerangVideoBg() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const capturedFramesRef = useRef<HTMLCanvasElement[]>([]);
  const lastTimeRef = useRef<number>(-1);
  const isCapturingRef = useRef<boolean>(false);
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentFrameIdxRef = useRef<number>(0);
  const directionRef = useRef<1 | -1>(1);

  const [isReady, setIsReady] = useState(false);
  const [playbackError, setPlaybackError] = useState(false);

  // Capture current video frame to an offscreen canvas
  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.paused || video.ended || !isCapturingRef.current) return;

    const currentTime = video.currentTime;
    // Deduplicate by currentTime
    if (Math.abs(currentTime - lastTimeRef.current) < 0.02) return;
    lastTimeRef.current = currentTime;

    const vidW = video.videoWidth || 960;
    const vidH = video.videoHeight || 540;
    if (vidW === 0 || vidH === 0) return;

    try {
      const scale = Math.min(1, MAX_CAPTURE_WIDTH / vidW);
      const targetW = Math.round(vidW * scale);
      const targetH = Math.round(vidH * scale);

      const offscreen = document.createElement("canvas");
      offscreen.width = targetW;
      offscreen.height = targetH;
      const ctx = offscreen.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, targetW, targetH);
        capturedFramesRef.current.push(offscreen);
      }
    } catch (err) {
      // If cross-origin prevents canvas extraction, fallback smoothly
      console.warn("Frame capture prevented, fallback to loop:", err);
      setPlaybackError(true);
      isCapturingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current as VideoElementWithRVFC | null;
    if (!video) return;

    isCapturingRef.current = true;
    capturedFramesRef.current = [];
    lastTimeRef.current = -1;

    let callbackId: number | null = null;
    let animFrameId: number | null = null;

    const handleVideoFrame = () => {
      if (!isCapturingRef.current) return;
      captureFrame();

      if (typeof video.requestVideoFrameCallback === "function") {
        callbackId = video.requestVideoFrameCallback(handleVideoFrame);
      } else {
        animFrameId = requestAnimationFrame(handleVideoFrame);
      }
    };

    const handleLoadedMetadata = () => {
      video.play().catch(() => {});

      if (typeof video.requestVideoFrameCallback === "function") {
        callbackId = video.requestVideoFrameCallback(handleVideoFrame);
      } else {
        animFrameId = requestAnimationFrame(handleVideoFrame);
      }
    };

    const handleEnded = () => {
      isCapturingRef.current = false;
      const frames = capturedFramesRef.current;

      if (frames.length > 5 && !playbackError) {
        setIsReady(true);
        startBoomerangPlayback(frames);
      } else {
        video.currentTime = 0;
        video.play().catch(() => {});
      }
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("ended", handleEnded);

    return () => {
      isCapturingRef.current = false;
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("ended", handleEnded);
      if (callbackId !== null && typeof video.cancelVideoFrameCallback === "function") {
        video.cancelVideoFrameCallback(callbackId);
      }
      if (animFrameId !== null) {
        cancelAnimationFrame(animFrameId);
      }
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, [captureFrame, playbackError]);

  // Canvas ping-pong / boomerang playback at 30fps
  const startBoomerangPlayback = (frames: HTMLCanvasElement[]) => {
    const canvas = canvasRef.current;
    if (!canvas || frames.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sample = frames[0];
    canvas.width = sample.width;
    canvas.height = sample.height;

    currentFrameIdxRef.current = 0;
    directionRef.current = 1;

    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
    }

    playbackIntervalRef.current = setInterval(() => {
      const idx = currentFrameIdxRef.current;
      const frame = frames[idx];

      if (frame && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
      }

      // Ping-pong index advance
      if (directionRef.current === 1) {
        if (idx >= frames.length - 1) {
          directionRef.current = -1;
          currentFrameIdxRef.current = Math.max(0, frames.length - 2);
        } else {
          currentFrameIdxRef.current = idx + 1;
        }
      } else {
        if (idx <= 0) {
          directionRef.current = 1;
          currentFrameIdxRef.current = Math.min(1, frames.length - 1);
        } else {
          currentFrameIdxRef.current = idx - 1;
        }
      }
    }, FRAME_INTERVAL);
  };

  return (
    <div
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none"
      aria-hidden="true"
    >
      {/* Wrapper: scale-[1.15] origin-top overflow-hidden */}
      <div className="w-full h-full scale-[1.15] origin-top overflow-hidden relative">
        {/* Hidden/capture video: while frames aren't ready, show live video; once ready, hide */}
        <video
          ref={videoRef}
          src={VIDEO_URL}
          muted
          playsInline
          autoPlay
          preload="auto"
          crossOrigin="anonymous"
          loop={playbackError}
          className={`w-full h-full object-cover object-top transition-opacity duration-700 ${
            isReady ? "hidden opacity-0" : "block opacity-100"
          }`}
        />

        {/* Display Canvas: ping-pong boomerang at 30fps */}
        <canvas
          ref={canvasRef}
          className={`w-full h-full object-cover object-top transition-opacity duration-700 ${
            isReady ? "block opacity-100" : "hidden opacity-0"
          }`}
        />

        {/* Subtle white vignette overlay for crisp readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/70 pointer-events-none" />
      </div>
    </div>
  );
}
