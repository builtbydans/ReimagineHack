import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function SafetyNotice({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-start gap-2.5 text-muted-foreground", compact ? "text-[11px] leading-relaxed" : "text-xs leading-relaxed", className)}>
      <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-plum-500" />
      <p>Thread does not provide emergency monitoring or medical advice. If you need urgent help, contact the appropriate emergency service.</p>
    </div>
  );
}
