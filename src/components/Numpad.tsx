import { useRef } from "react";

interface NumpadProps {
  onKey: (key: string) => void;
}

type Key = {
  label: string;
  value: string;
  wide?: boolean;
  accent?: boolean;
  danger?: boolean;
};

const KEYS: Key[][] = [
  [
    { label: "C", value: "C", danger: true },
    { label: "⌫", value: "DEL", wide: true },
    { label: "÷", value: "÷", accent: true },
  ],
  [
    { label: "7", value: "7" },
    { label: "8", value: "8" },
    { label: "9", value: "9" },
    { label: "×", value: "×", accent: true },
  ],
  [
    { label: "4", value: "4" },
    { label: "5", value: "5" },
    { label: "6", value: "6" },
    { label: "−", value: "−", accent: true },
  ],
  [
    { label: "1", value: "1" },
    { label: "2", value: "2" },
    { label: "3", value: "3" },
    { label: "+", value: "+", accent: true },
  ],
  [
    { label: "00", value: "00" },
    { label: "0", value: "0" },
    { label: ".", value: "." },
    { label: "=", value: "=" },
  ],
];

export function Numpad({ onKey }: NumpadProps) {
  const repeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function startRepeat(fn: () => void) {
    fn();
    delayRef.current = setTimeout(() => {
      repeatRef.current = setInterval(fn, 80);
    }, 400);
  }

  function stopRepeat() {
    if (delayRef.current) {
      clearTimeout(delayRef.current);
      delayRef.current = null;
    }
    if (repeatRef.current) {
      clearInterval(repeatRef.current);
      repeatRef.current = null;
    }
  }

  return (
    <div className="grid grid-cols-4 gap-2 p-3">
      {KEYS.flat().map((key) => {
        const isDel = key.value === "DEL";
        const base =
          "h-16 rounded-2xl text-2xl font-semibold select-none active:scale-95 transition-transform flex items-center justify-center cursor-pointer";
        let color = "bg-[var(--bg-input)] text-[var(--text-1)]";
        if (key.danger) color = "bg-[var(--danger-bg)] text-[var(--danger-t)]";
        else if (key.accent)
          color = "bg-[var(--accent-hi)] text-[var(--accent-txt)]";

        return (
          <button
            key={key.value}
            className={`${base} ${color}${key.wide ? " col-span-2" : ""}`}
            {...(isDel
              ? {
                  onPointerDown: (e) => {
                    e.preventDefault();
                    startRepeat(() => onKey("DEL"));
                  },
                  onPointerUp: stopRepeat,
                  onPointerLeave: stopRepeat,
                }
              : {
                  onPointerDown: (e) => {
                    e.preventDefault();
                    onKey(key.value);
                  },
                })}
          >
            {key.label}
          </button>
        );
      })}
    </div>
  );
}
