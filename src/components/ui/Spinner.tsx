import { LoaderCircle } from "lucide-react";
import { cn } from "../../lib/utils";

export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle className={cn("h-5 w-5 animate-spin text-accent", className)} aria-hidden />;
}

export function PageSpinner({ label = "Đang tải..." }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted">
      <Spinner className="h-8 w-8" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
