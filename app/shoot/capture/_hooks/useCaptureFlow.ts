"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useShootSession } from "@/lib/shootSessionStore";

const MAX_SHOTS = 8;
const MAX_COUNT = 8;

export function useCaptureFlow() {
  const router = useRouter();
  const { frameId, addShotPhoto, attachVideoToShot, resetShots } =
    useShootSession();

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isShooting, setIsShooting] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [shotCount, setShotCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const shutterAudioRef = useRef<HTMLAudioElement | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const remainingShots = Math.max(0, MAX_SHOTS - shotCount);

  // 프레임 없이 들어오면 되돌리기
  useEffect(() => {
    if (!frameId) {
      router.replace("/shoot");
    }
  }, [frameId, router]);

  // 카메라 켜기
  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert("이 브라우저에서는 카메라 사용을 지원하지 않아요.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraReady(true);
    } catch (err) {
      console.error(err);
      alert("카메라 접근이 거부되었거나 오류가 발생했어요.");
    }
  };

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const playShutterSound = useCallback(() => {
    const audio = shutterAudioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, []);

  // 현재 프레임을 캔버스로 캡쳐해 dataURL로 변환
  const capturePhotoToDataUrl = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const width = video.videoWidth || 480;
    const height = video.videoHeight || 640;
    canvas.width = width;
    canvas.height = height;

    // 좌우 반전해서 그리기
    ctx.save();
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, width, height);
    ctx.restore();

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    playShutterSound();
    return dataUrl;
  }, [playShutterSound]);

  // 한 샷용 녹화 시작
  const startRecordingForShot = useCallback(() => {
    if (!streamRef.current || typeof MediaRecorder === "undefined") return;

    try {
      recordedChunksRef.current = [];

      const mr = new MediaRecorder(streamRef.current, {
        mimeType: "video/webm;codecs=vp9",
      });

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      mr.onstop = () => {
        if (!recordedChunksRef.current.length) return;
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });
        const videoUrl = URL.createObjectURL(blob);
        attachVideoToShot(videoUrl); // 아직 video 없는 샷에 붙임
        recordedChunksRef.current = [];
      };

      mediaRecorderRef.current = mr;
      mr.start();
    } catch (err) {
      console.error("MediaRecorder start error:", err);
    }
  }, [attachVideoToShot]);

  // 한 장 촬영 완료 처리 (사진 캡쳐 + 녹화 stop + 다음 샷 or 종료)
  const finishSingleShot = useCallback(() => {
    const photoDataUrl = capturePhotoToDataUrl();
    if (!photoDataUrl) return;

    // 1) 사진 저장
    addShotPhoto(photoDataUrl);

    // 2) 녹화 중이면 stop → onstop에서 video 붙음
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") {
      mr.stop();
    }

    // 3) 카운트 증가 후 다음 흐름
    setShotCount((prev) => {
      const next = prev + 1;

      if (next >= MAX_SHOTS) {
        setIsShooting(false);
        setCountdown(null);
        router.push("/shoot/select");
      } else {
        startRecordingForShot();
        setCountdown(MAX_COUNT);
      }

      return next;
    });
  }, [capturePhotoToDataUrl, addShotPhoto, router, startRecordingForShot]);

  // 자동 촬영 시작
  const startShooting = () => {
    if (!isCameraReady) {
      alert("먼저 카메라를 켜주세요.");
      return;
    }
    resetShots();
    setShotCount(0);
    setIsShooting(true);
    startRecordingForShot();
    setCountdown(MAX_COUNT);
  };

  // 10초 카운트다운
  useEffect(() => {
    if (!isShooting) return;
    if (countdown === null) return;

    const timer = window.setTimeout(() => {
      if (countdown <= 1) {
        finishSingleShot();
      } else {
        setCountdown(countdown - 1);
      }
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [isShooting, countdown, finishSingleShot]);

  // "지금 촬영" 버튼
  const handleShootNow = () => {
    if (!isShooting || !isCameraReady) return;
    finishSingleShot();
  };

  return {
    // refs
    videoRef,
    canvasRef,
    shutterAudioRef,
    // 상태
    isCameraReady,
    isShooting,
    countdown,
    shotCount,
    remainingShots,
    // 액션
    startCamera,
    startShooting,
    handleShootNow,
    MAX_SHOTS,
    MAX_COUNT,
  };
}
