import React, { useCallback, useEffect, useRef, useState } from "react";
import { fmtDuration } from "../lib/content-rules";
import { db } from "../lib/mock/db";
import { useAuth } from "../context/AuthContext";

export default function MediaPlayer({
  episodeId,
  mediaUrl,
  mediaType,
  initialPosition,
  onCompleted,
  poster,
}: {
  episodeId: string;
  mediaUrl: string;
  mediaType: "AUDIO" | "VIDEO";
  initialPosition: number;
  onCompleted?: () => void;
  poster?: string | null;
}) {
  const { user } = useAuth();
  const ref = useRef<HTMLMediaElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(initialPosition);
  const [dur, setDur] = useState(0);
  const lastSaved = useRef(0);
  const seededRef = useRef(false);

  const save = useCallback(
    (positionSec: number, completed: boolean) => {
      lastSaved.current = Date.now();
      if (user?.id) {
        db.progress.upsert(user.id, episodeId, Math.round(positionSec), completed);
      }
    },
    [episodeId, user?.id],
  );

  // seed the start position once metadata is known
  const onLoaded = () => {
    const el = ref.current;
    if (!el) return;
    setDur(el.duration || 0);
    if (!seededRef.current && initialPosition > 0 && initialPosition < (el.duration || Infinity) - 2) {
      el.currentTime = initialPosition;
    }
    seededRef.current = true;
  };

  const onTime = () => {
    const el = ref.current;
    if (!el) return;
    setCur(el.currentTime);
    if (Date.now() - lastSaved.current > 4000) {
      save(el.currentTime, false);
    }
  };

  const onEnded = () => {
    setPlaying(false);
    save(ref.current?.duration ?? cur, true);
    onCompleted?.();
  };

  // save on unmount / tab hide
  useEffect(() => {
    const handler = () => {
      const el = ref.current;
      if (el && el.currentTime > 0) save(el.currentTime, el.ended);
    };
    document.addEventListener("visibilitychange", handler);
    window.addEventListener("pagehide", handler);
    return () => {
      document.removeEventListener("visibilitychange", handler);
      window.removeEventListener("pagehide", handler);
      handler();
    };
  }, [save]);

  function toggle() {
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => {});
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
      save(el.currentTime, false);
    }
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || !dur) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    el.currentTime = pct * dur;
    setCur(el.currentTime);
  }

  const pct = dur ? (cur / dur) * 100 : 0;

  return (
    <div>
      <div className="relative flex h-[220px] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_40%,rgba(231,199,103,0.18),transparent_60%),linear-gradient(200deg,#164E44,#08201A)]">
        {mediaType === "VIDEO" ? (
          <video
            ref={ref as React.RefObject<HTMLVideoElement>}
            src={mediaUrl}
            poster={poster ?? undefined}
            className="h-full w-full object-contain"
            onLoadedMetadata={onLoaded}
            onTimeUpdate={onTime}
            onEnded={onEnded}
            playsInline
          />
        ) : (
          <>
            {poster && (
              <>
                <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_28%]" />
                <div className="absolute inset-0 bg-[#0A1F17]/55" />
              </>
            )}
            <audio
              ref={ref as React.RefObject<HTMLAudioElement>}
              src={mediaUrl}
              onLoadedMetadata={onLoaded}
              onTimeUpdate={onTime}
              onEnded={onEnded}
            />
            <button
              onClick={toggle}
              className="relative flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-gold-light bg-black/40 text-gold-light backdrop-blur transition hover:scale-105 active:scale-95 shadow-lg"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <PauseIcon /> : <PlayIcon />}
            </button>
          </>
        )}
        <div className="absolute inset-x-4 bottom-3">
          <div
            className="h-[4px] cursor-pointer rounded bg-white/25 hover:h-[6px] transition-all"
            onClick={seek}
          >
            <div className="h-full rounded bg-gold" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between text-[9px] font-bold text-[#C7C0A4]">
            <span>{fmtDuration(cur)}</span>
            <span>{fmtDuration(dur || 0)}</span>
          </div>
        </div>
      </div>

      {mediaType === "VIDEO" && (
        <div className="flex justify-center bg-[#0A1F17] py-3">
          <button
            onClick={toggle}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-gold-light text-gold-light transition hover:scale-105 active:scale-95"
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
        </div>
      )}
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  );
}
