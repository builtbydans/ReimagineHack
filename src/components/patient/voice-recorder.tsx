"use client";

import { AlertCircle, Check, Mic2, RotateCcw, Square, Volume2 } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PatientRecording = {
  blob: Blob;
  url: string;
  durationSeconds: number;
  mimeType: string;
};

type RecorderStatus = "idle" | "requesting" | "recording" | "recorded" | "denied" | "unavailable" | "error";

const waveformBars = [9, 18, 12, 25, 16, 31, 20, 35, 14, 28, 19, 33, 17, 26, 12, 22, 15, 30, 18, 24, 11, 20, 14, 9];

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function VoiceRecorder({
  onRecordingChange,
  onUseWriting,
  disabled = false,
}: {
  onRecordingChange: (recording: PatientRecording | null) => void;
  onUseWriting: () => void;
  disabled?: boolean;
}) {
  const [status, setStatus] = React.useState<RecorderStatus>("idle");
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const [recording, setRecording] = React.useState<PatientRecording | null>(null);
  const [errorMessage, setErrorMessage] = React.useState("");
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const chunksRef = React.useRef<BlobPart[]>([]);
  const timerRef = React.useRef<number | null>(null);
  const startedAtRef = React.useRef<number>(0);
  const recordingUrlRef = React.useRef<string | null>(null);

  const stopTracks = React.useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const stopTimer = React.useCallback(() => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  React.useEffect(() => () => {
    stopTimer();
    stopTracks();
    if (recordingUrlRef.current) URL.revokeObjectURL(recordingUrlRef.current);
  }, [stopTimer, stopTracks]);

  const startRecording = async () => {
    if (disabled) return;

    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia || !("MediaRecorder" in window)) {
      setStatus("unavailable");
      return;
    }

    setStatus("requesting");
    setErrorMessage("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      setElapsedSeconds(0);

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        stopTimer();
        stopTracks();
        setErrorMessage("The recording stopped unexpectedly. You can try again or write your update instead.");
        setStatus("error");
      };
      recorder.onstop = () => {
        stopTimer();
        stopTracks();
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (!blob.size) {
          setErrorMessage("We could not capture any audio. Please try again or write your update.");
          setStatus("error");
          return;
        }

        if (recordingUrlRef.current) URL.revokeObjectURL(recordingUrlRef.current);
        const url = URL.createObjectURL(blob);
        recordingUrlRef.current = url;
        const durationSeconds = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
        const nextRecording = { blob, url, durationSeconds, mimeType };
        setElapsedSeconds(durationSeconds);
        setRecording(nextRecording);
        onRecordingChange(nextRecording);
        setStatus("recorded");
      };

      recorder.start(250);
      startedAtRef.current = Date.now();
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 250);
      setStatus("recording");
    } catch (error) {
      stopTimer();
      stopTracks();
      const name = error instanceof DOMException ? error.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setStatus("denied");
      } else {
        setErrorMessage("Your microphone could not be opened. You can try again or continue by writing.");
        setStatus("error");
      }
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  };

  const removeRecording = () => {
    if (recordingUrlRef.current) URL.revokeObjectURL(recordingUrlRef.current);
    recordingUrlRef.current = null;
    setRecording(null);
    setElapsedSeconds(0);
    setStatus("idle");
    onRecordingChange(null);
  };

  if (status === "denied" || status === "unavailable" || status === "error") {
    const unavailable = status === "unavailable";
    const denied = status === "denied";
    return (
      <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/70 p-5 text-center sm:p-7">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-white text-amber-700 shadow-sm"><AlertCircle className="size-5" /></span>
        <h3 className="mt-4 text-base font-semibold">
          {denied ? "Microphone access is turned off" : unavailable ? "Voice recording is not available here" : "We could not start the recording"}
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {denied
            ? "That is completely okay. You can allow microphone access in your browser settings, or share the same update in writing."
            : unavailable
              ? "This browser does not support in-page recording. Writing works just as well — voice is only one way to add an update."
              : errorMessage}
        </p>
        <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
          {!unavailable ? <Button type="button" variant="outline" size="sm" onClick={() => { setStatus("idle"); setErrorMessage(""); }}>Try recording again</Button> : null}
          <Button type="button" size="sm" onClick={onUseWriting}>Write instead</Button>
        </div>
      </div>
    );
  }

  if (status === "recorded" && recording) {
    return (
      <div className="rounded-[1.5rem] border border-sage-200 bg-sage-50/60 p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-sage-600 text-white"><Check className="size-4" /></span>
          <div>
            <p className="text-sm font-semibold">Recording ready</p>
            <p className="text-xs text-muted-foreground">{formatDuration(recording.durationSeconds)} · Listen before continuing if you would like.</p>
          </div>
        </div>
        <audio controls src={recording.url} className="mt-5 w-full" aria-label="Playback of your recorded update" />
        <Button type="button" variant="ghost" size="sm" className="mt-4 px-2 text-muted-foreground" onClick={removeRecording} disabled={disabled}>
          <RotateCcw /> Remove and record again
        </Button>
      </div>
    );
  }

  const isRecording = status === "recording";
  const isRequesting = status === "requesting";

  return (
    <div className={cn("relative overflow-hidden rounded-[1.5rem] border p-6 text-center transition-colors sm:p-8", isRecording ? "border-plum-300 bg-plum-950 text-white" : "border-plum-100 bg-gradient-to-b from-white to-plum-50/70")}>
      {isRecording ? <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(204,167,187,.18),transparent_58%)]" /> : null}
      <div className="relative">
        <div className="mx-auto flex h-12 max-w-xs items-center justify-center gap-1" aria-hidden="true">
          {waveformBars.map((height, index) => (
            <span
              key={`${height}-${index}`}
              className={cn("w-1 rounded-full", isRecording ? "animate-wave bg-plum-200" : "bg-plum-200")}
              style={{ height, animationDelay: `${index * 45}ms` }}
            />
          ))}
        </div>
        <p className={cn("mt-4 font-mono text-3xl font-semibold tabular-nums tracking-[-.04em]", isRecording ? "text-white" : "text-plum-950")}>{formatDuration(elapsedSeconds)}</p>
        <p className={cn("mt-2 text-sm", isRecording ? "text-plum-200" : "text-muted-foreground")}>{isRecording ? "Recording… speak at your own pace" : isRequesting ? "Waiting for microphone permission…" : "Tap when you are ready"}</p>

        {isRecording ? (
          <Button type="button" size="lg" onClick={stopRecording} className="mt-6 bg-white text-plum-900 hover:bg-plum-50">
            <Square className="fill-current" /> Stop recording
          </Button>
        ) : (
          <Button type="button" size="lg" onClick={startRecording} disabled={disabled || isRequesting} className="mt-6">
            <Mic2 /> {isRequesting ? "Opening microphone…" : "Start recording"}
          </Button>
        )}
        <div className={cn("mx-auto mt-5 flex max-w-sm items-center justify-center gap-2 text-[11px] leading-4", isRecording ? "text-plum-300" : "text-muted-foreground")}>
          <Volume2 className="size-3.5 shrink-0" /> Your recording stays in this browser until you choose to process it.
        </div>
      </div>
    </div>
  );
}
