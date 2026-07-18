"use client";

import * as React from "react";

const completedAnimations = new Set<string>();

export function TypedText({
  text,
  animationKey,
  className,
}: {
  text: string;
  animationKey: string;
  className?: string;
}) {
  const [visibleText, setVisibleText] = React.useState(() =>
    completedAnimations.has(animationKey) ? text : "",
  );

  React.useEffect(() => {
    if (completedAnimations.has(animationKey)) {
      const completedFrame = window.requestAnimationFrame(() =>
        setVisibleText(text),
      );
      return () => window.cancelAnimationFrame(completedFrame);
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducedMotion || !text) {
      completedAnimations.add(animationKey);
      const reducedMotionFrame = window.requestAnimationFrame(() =>
        setVisibleText(text),
      );
      return () => window.cancelAnimationFrame(reducedMotionFrame);
    }

    const startedAt = performance.now();
    const duration = Math.min(1_800, Math.max(240, text.length * 10));
    let frame = 0;
    const renderFrame = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const characterCount = Math.max(1, Math.floor(progress * text.length));
      setVisibleText(text.slice(0, characterCount));
      if (progress < 1) {
        frame = window.requestAnimationFrame(renderFrame);
      } else {
        completedAnimations.add(animationKey);
      }
    };
    frame = window.requestAnimationFrame(renderFrame);
    return () => window.cancelAnimationFrame(frame);
  }, [animationKey, text]);

  return <span className={className}>{visibleText}</span>;
}
