"use client";

import { Group, Rect, Text as KonvaText } from "react-konva";
import type { GroupConfig } from "konva/lib/Group";
import type Konva from "konva";
import type { TextComponent } from "@/lib/types/themeEditor";
import { getOpacity } from "../utils";

type Props = {
  c: TextComponent;
  common: Partial<GroupConfig> & {
    onClick: () => void;
    onTap: () => void;
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  };
  outline: React.ReactNode;
};

export function TextNode({ c, common, outline }: Props) {
  const style = c.styleJson;
  const opacity = getOpacity(style);

  return (
    <Group {...common} opacity={opacity}>
      {outline}
      <KonvaText
        text={c.source}
        width={c.width}
        height={c.height}
        fontFamily={style.fontFamily ?? "Pretendard"}
        fontSize={style.fontSize ?? 48}
        fill={style.color ?? "#ffffff"}
        align={style.textAlign ?? "left"}
        verticalAlign="middle"
      />
      <Rect width={c.width} height={c.height} fill="rgba(0,0,0,0)" />
    </Group>
  );
}
