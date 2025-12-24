"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FrameId } from "@/constants/frames";
import { FramePicker } from "@/components/frame/FramePicker";
import { useThemeSession } from "@/lib/themeSessionStore";

export default function ThemePage() {
  const router = useRouter();
  const { frameId, setFrameId, reset } = useThemeSession();

  // 항상 기본값으로 시작
  const [selectedFrameId, setSelectedFrameId] = useState<FrameId>(
    frameId ?? "classic-4"
  );

  // theme 페이지 진입 시 세션 초기화
  useEffect(() => {
    reset();
  }, [reset]);

  const handleConfirmFrame = () => {
    setFrameId(selectedFrameId);
    router.push("/theme/sticker"); // 다음 단계
  };

  return (
    <main className="min-h-dvh bg-zinc-950 text-white px-2 py-6">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <header className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] tracking-[0.16em] text-zinc-500">
              RECORDAY
            </span>
            <h1 className="text-lg font-semibold tracking-tight">
              테마 꾸미기 · 프레임 선택
            </h1>
          </div>
          <Link
            href="/home"
            className="text-xs text-zinc-400 underline underline-offset-4"
          >
            홈으로
          </Link>
        </header>

        <FramePicker
          selectedFrameId={selectedFrameId}
          onChangeSelected={setSelectedFrameId}
          onConfirm={handleConfirmFrame}
          confirmLabel="이 프레임으로 테마 만들기"
        />
      </div>
    </main>
  );
}
