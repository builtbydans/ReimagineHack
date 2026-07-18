import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ThreadLogo } from "@/components/shared/thread-logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-5">
      <div className="max-w-md text-center">
        <ThreadLogo className="justify-center" />
        <p className="mt-10 text-xs font-semibold uppercase tracking-[.2em] text-plum-500">
          404
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-.05em]">
          This moment isn’t in the story.
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          The page you’re looking for could not be found.
        </p>
        <Button asChild className="mt-7">
          <Link href="/">
            <ArrowLeft /> Back to Threads
          </Link>
        </Button>
      </div>
    </main>
  );
}
