export function clamp(v: number, min: number, max: number) {
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, v));
}

export function getOpacity(styleJson: unknown): number {
  const o =
    typeof styleJson === "object" &&
    styleJson !== null &&
    "opacity" in styleJson
      ? (styleJson as { opacity?: unknown }).opacity
      : undefined;

  const n = typeof o === "number" ? o : 1;
  return clamp(n, 0, 1);
}
