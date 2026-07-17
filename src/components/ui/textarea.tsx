import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn("flex min-h-32 w-full rounded-2xl border border-input bg-white px-4 py-3 text-base leading-relaxed placeholder:text-muted-foreground/70 focus-visible:border-plum-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum-200 disabled:opacity-50", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
