import { ThreadMark } from "@/components/shared/thread-logo";

export default function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-plum-600">
        <ThreadMark className="size-10 animate-soft-pulse" />
        <p className="text-xs font-semibold tracking-wide text-muted-foreground">Gathering your story…</p>
      </div>
    </div>
  );
}
