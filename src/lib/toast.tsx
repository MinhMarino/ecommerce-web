import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import { cn } from "./utils";

type ToastKind = "success" | "error" | "info";

type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
};

type ToastCtx = {
  show: (kind: ToastKind, message: string) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

let seq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (kind: ToastKind, message: string) => {
      const id = ++seq;
      setToasts((list) => [...list, { id, kind, message }]);
      setTimeout(() => dismiss(id), 3800);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:right-4 sm:left-auto sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border px-4 py-3 shadow-pop backdrop-blur animate-fade-in",
              "bg-surface text-ink border-line",
            )}
          >
            {t.kind === "success" && (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-ok" />
            )}
            {t.kind === "error" && (
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
            )}
            {t.kind === "info" && (
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-info" />
            )}
            <p className="flex-1 text-sm leading-snug">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Đóng thông báo"
              className="text-muted hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast outside provider");
  return {
    success: (message: string) => ctx.show("success", message),
    error: (message: string) => ctx.show("error", message),
    info: (message: string) => ctx.show("info", message),
  };
}
