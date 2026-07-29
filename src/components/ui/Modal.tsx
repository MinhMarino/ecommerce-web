import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        aria-label="Đóng"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-lg rounded-card border border-line bg-surface p-5 shadow-pop animate-fade-in sm:p-6",
          className,
        )}
      >
        {title && (
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="rounded-lg p-1.5 text-muted hover:bg-subtle hover:text-ink"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
