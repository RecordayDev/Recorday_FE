"use client";

import { create } from "zustand";
import type { FrameId } from "@/constants/frames";

const MAX_SELECT = 4;

export type ShotItem = {
  photo: string;
  video?: string;
};

type ShootSessionState = {
  frameId: FrameId | null;
  shots: ShotItem[];
  selectedIndexes: (number | null)[];

  setFrameId: (id: FrameId) => void;
  addShotPhoto: (dataUrl: string) => void;
  attachVideoToShot: (videoUrl: string) => void;
  resetShots: () => void;
  toggleSelect: (index: number) => void;
  setSelectedIndexes: (indexes: number[]) => void;
  resetAll: () => void;
};

export const useShootSession = create<ShootSessionState>((set) => ({
  frameId: null,
  shots: [],
  selectedIndexes: Array(MAX_SELECT).fill(null),

  setFrameId: (id) => set({ frameId: id }),

  addShotPhoto: (dataUrl) =>
    set((state) => ({
      shots: [...state.shots, { photo: dataUrl }],
    })),

  attachVideoToShot: (videoUrl) =>
    set((state) => {
      const next = [...state.shots];
      const idx = next.findIndex((shot) => !shot.video);
      if (idx === -1) return state;
      next[idx] = { ...next[idx], video: videoUrl };
      return { shots: next };
    }),

  resetShots: () =>
    set({
      shots: [],
      selectedIndexes: Array(MAX_SELECT).fill(null),
    }),

  toggleSelect: (index) =>
    set((state) => {
      const { selectedIndexes } = state;

      const existingSlot = selectedIndexes.indexOf(index);
      if (existingSlot !== -1) {
        const next = [...selectedIndexes];
        next[existingSlot] = null;
        return { selectedIndexes: next };
      }

      const emptySlot = selectedIndexes.indexOf(null);
      if (emptySlot === -1) return state;

      const next = [...selectedIndexes];
      next[emptySlot] = index;
      return { selectedIndexes: next };
    }),

  setSelectedIndexes: (indexes) => set({ selectedIndexes: indexes }),

  resetAll: () =>
    set({
      frameId: null,
      shots: [],
      selectedIndexes: Array(MAX_SELECT).fill(null),
    }),
}));
