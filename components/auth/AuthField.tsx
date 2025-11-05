import type { InputHTMLAttributes } from "react";

type AuthFieldProps = {
  label: string;
  error?: string | null;
} & InputHTMLAttributes<HTMLInputElement>;

export function AuthField({
  label,
  error,
  id,
  className = "",
  ...inputProps
}: AuthFieldProps) {
  return (
    <div className="flex flex-col gap-1.5 text-[11px]">
      <label htmlFor={id} className="text-zinc-300">
        {label}
      </label>
      <input
        id={id}
        className={[
          "h-9 rounded-lg border bg-zinc-950 px-3 text-[11px] text-zinc-100",
          "placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500",
          error ? "border-red-500" : "border-zinc-700",
          className,
        ].join(" ")}
        {...inputProps}
      />
      {error && (
        <p className="text-[10px] text-red-400 leading-relaxed">{error}</p>
      )}
    </div>
  );
}
