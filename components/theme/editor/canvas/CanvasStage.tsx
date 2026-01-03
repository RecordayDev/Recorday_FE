"use client";

import { useEffect, useMemo, useRef } from "react";
import { Stage, Layer, Rect, Transformer } from "react-konva";
import Konva from "konva";

import { FRAME_LAYOUTS } from "@/constants/frameLayouts";
import { useThemeEditorStore } from "@/lib/themeEditorStore";
import { EditableNode } from "./EditableNode";
import { TextStyleJson } from "@/lib/types/themeEditor";

const VIEW_SIZE = 330;

export function CanvasStage() {
  const frameId = useThemeEditorStore((s) => s.frameId);
  const components = useThemeEditorStore((s) => s.components);
  const activeId = useThemeEditorStore((s) => s.activeId);

  const setActive = useThemeEditorStore((s) => s.setActive);
  const update = useThemeEditorStore((s) => s.updateComponent);

  const layout = frameId ? FRAME_LAYOUTS[frameId] : null;

  const stageRef = useRef<Konva.Stage | null>(null);
  const trRef = useRef<Konva.Transformer | null>(null);

  const { viewW, viewH, scale } = useMemo(() => {
    if (!layout) return { viewW: VIEW_SIZE, viewH: VIEW_SIZE, scale: 1 };

    const s = Math.min(
      VIEW_SIZE / layout.totalWidth,
      VIEW_SIZE / layout.totalHeight
    );

    return {
      viewW: Math.round(layout.totalWidth * s),
      viewH: Math.round(layout.totalHeight * s),
      scale: s,
    };
  }, [layout]);

  useEffect(() => {
    const stage = stageRef.current;
    const tr = trRef.current;
    if (!stage || !tr) return;

    if (!activeId) {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      return;
    }

    let raf1 = 0;
    let raf2 = 0;

    const attach = () => {
      const node = stage.findOne(`#node-${activeId}`);
      if (!node) return;

      tr.nodes([node]);
      tr.forceUpdate();
      tr.getLayer()?.batchDraw();
    };

    raf1 = requestAnimationFrame(() => {
      attach();
      raf2 = requestAnimationFrame(() => attach());
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [activeId, components]);

  const sorted = useMemo(
    () => [...components].sort((a, b) => a.zIndex - b.zIndex),
    [components]
  );

  if (!layout) return null;

  const frameW = layout.totalWidth;
  const frameH = layout.totalHeight;

  return (
    <div className="w-[330px]">
      <div className="flex justify-center">
        <Stage
          ref={stageRef}
          width={viewW}
          height={viewH}
          scaleX={scale}
          scaleY={scale}
          className="rounded-2xl border border-zinc-800 bg-zinc-950"
          onMouseDown={(e) => {
            if (e.target === e.target.getStage()) setActive(null);
          }}
          onTouchStart={(e) => {
            if (e.target === e.target.getStage()) setActive(null);
          }}
        >
          {/* 1) 아래: 프레임 배경 + 슬롯(구멍 느낌) */}
          <Layer listening={false}>
            <Rect
              x={0}
              y={0}
              width={frameW}
              height={frameH}
              fill="#111827"
              cornerRadius={60}
            />

            {layout.slots.map((s, i) => (
              <Rect
                key={i}
                x={s.x}
                y={s.y}
                width={s.width}
                height={s.height}
                cornerRadius={40}
                fill="rgba(0,0,0,0.30)"
              />
            ))}
          </Layer>

          {/* 2) 가운데: 오브젝트들 */}
          <Layer>
            {sorted.map((c) => (
              <EditableNode
                key={c.id}
                c={c}
                isActive={c.id === activeId}
                onSelect={() => setActive(c.id)}
                onCommit={(patch) => update(c.id, patch)}
              />
            ))}

            <Transformer
              ref={trRef}
              rotateEnabled
              flipEnabled={false}
              enabledAnchors={[
                "top-left",
                "top-right",
                "bottom-left",
                "bottom-right",
                "middle-left",
                "middle-right",
                "top-center",
                "bottom-center",
              ]}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 40 || newBox.height < 40) return oldBox;
                return newBox;
              }}
              onTransformEnd={() => {
                const stage = stageRef.current;
                if (!stage || !activeId) return;

                const node = stage.findOne(
                  `#node-${activeId}`
                ) as Konva.Node | null;
                if (!node) return;

                const c = components.find((x) => x.id === activeId);
                if (!c) return;

                const sx = node.scaleX();
                const sy = node.scaleY();

                // scale을 width/height에만 반영
                node.scaleX(1);
                node.scaleY(1);

                const nextW = Math.max(1, c.width * sx);
                const nextH = Math.max(1, c.height * sy);
                const nextRot = node.rotation();

                if (c.type === "TEXT") {
                  const style = c.styleJson;
                  const baseFont = style.fontSize ?? 48;
                  const factor = Math.max(sx, sy);
                  const nextFontSize = Math.max(
                    1,
                    Math.round(baseFont * factor)
                  );

                  update(activeId, {
                    x: node.x(),
                    y: node.y(),
                    rotation: nextRot,
                    width: nextW,
                    height: nextH,
                    styleJson: {
                      fontSize: nextFontSize,
                    } as Partial<TextStyleJson>,
                    scale: 1,
                  });
                  return;
                }

                // PHOTO / STICKER
                update(activeId, {
                  x: node.x(),
                  y: node.y(),
                  rotation: nextRot,
                  width: nextW,
                  height: nextH,
                  scale: 1,
                });
              }}
            />
          </Layer>

          {/* 3) 위: 프레임 오버레이(항상 보이게) */}
          <Layer listening={false}>
            {layout.slots.map((s, i) => (
              <Rect
                key={i}
                x={s.x}
                y={s.y}
                width={s.width}
                height={s.height}
                cornerRadius={40}
                stroke="rgba(255,255,255,0.18)"
                strokeWidth={6}
              />
            ))}

            <Rect
              x={0}
              y={0}
              width={frameW}
              height={frameH}
              cornerRadius={60}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth={6}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
