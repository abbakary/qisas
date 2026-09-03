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
  const [isFullscreen, setIsFullscreen] = useState(false);
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

  // Save on unmount / tab hide
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

  // Lock/unlock body scroll when CSS fullscreen is active
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  // Close fullscreen on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) setIsFullscreen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isFullscreen]);

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

  // ─── Shared progress + controls overlay (used in both normal and fullscreen) ───
  const controls = (
    <>
      {/* Fullscreen toggle — top right */}
      <button
        onClick={() => setIsFullscreen((v) => !v)}
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        className="absolute top-2.5 right-2.5 z-30 flex h-8 w-8 items-center justify-center rounded-xl bg-black/55 text-white/90 backdrop-blur-sm border border-white/15 transition hover:bg-black/75 hover:text-white active:scale-95 shadow-md"
      >
        {isFullscreen ? <ExitFullscreenIcon /> : <EnterFullscreenIcon />}
      </button>

      {/* Progress bar + timestamps — bottom */}
      <div className="absolute inset-x-4 bottom-3 z-30">
        <div
          className="h-[4px] cursor-pointer rounded-full bg-white/25 hover:h-[6px] transition-all"
          onClick={seek}
        >
          <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1.5 flex justify-between text-[9px] font-bold text-[#C7C0A4]">
          <span>{fmtDuration(cur)}</span>
          <span>{fmtDuration(dur || 0)}</span>
        </div>
      </div>
    </>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // CSS FULLSCREEN VIEW — fixed overlay covering entire viewport
  // ─────────────────────────────────────────────────────────────────────────────
  if (isFullscreen) {
    return (
      <div
        className="fixed inset-0 z-[9999] flex flex-col bg-black"
        style={{ touchAction: "none" }}
      >
        {mediaType === "VIDEO" ? (
          // Video: fill the entire screen
          <div className="relative flex-1 flex items-center justify-center bg-black overflow-hidden">
            <video
              ref={ref as React.RefObject<HTMLVideoElement>}
              src={mediaUrl}
              poster={poster ?? undefined}
              className="w-full h-full object-contain"
              onLoadedMetadata={onLoaded}
              onTimeUpdate={onTime}
              onEnded={onEnded}
              playsInline
              autoPlay
            />
            {/* Tap to play/pause on video */}
            <div
              className="absolute inset-0 z-10 cursor-pointer"
              onClick={toggle}
              aria-label={playing ? "Pause" : "Play"}
            />
            {/* Center play/pause indicator */}
            {!playing && (
              <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/50 text-white">
                  <PlayIcon size={32} />
                </div>
              </div>
            )}
            {controls}
          </div>
        ) : (
          // Audio fullscreen: centered artwork + big play button
          <div className="relative flex-1 flex flex-col items-center justify-center bg-[#0A1F17] overflow-hidden">
            {poster && (
              <>
                <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0A1F17]/60 via-[#0A1F17]/40 to-[#0A1F17]/80" />
              </>
            )}
            <audio
              ref={ref as React.RefObject<HTMLAudioElement>}
              src={mediaUrl}
              onLoadedMetadata={onLoaded}
              onTimeUpdate={onTime}
              onEnded={onEnded}
              autoPlay
            />
            {/* Poster artwork */}
            {poster && (
              <div className="relative z-10 mb-8 h-52 w-52 rounded-3xl overflow-hidden shadow-2xl ring-2 ring-gold/30">
                <img src={poster} alt="" className="h-full w-full object-cover" />
              </div>
            )}
            {/* Big play/pause button */}
            <button
              onClick={toggle}
              className="relative z-10 flex h-20 w-20 cursor-pointer items-center justify-center rounded-full border-2 border-gold-light bg-black/40 text-gold-light backdrop-blur transition hover:scale-105 active:scale-95 shadow-xl"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <PauseIcon size={32} /> : <PlayIcon size={32} />}
            </button>
            {controls}
          </div>
        )}

        {/* Bottom bar with play + close in fullscreen */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-black/70 backdrop-blur-sm border-t border-white/10">
          <button
            onClick={toggle}
            aria-label={playing ? "Pause" : "Play"}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-gold-light text-gold-light transition hover:scale-105 active:scale-95"
          >
            {playing ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
          </button>

          <div className="flex-1 mx-4">
            <div
              className="h-[5px] cursor-pointer rounded-full bg-white/20"
              onClick={seek}
            >
              <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-1 flex justify-between text-[10px] font-bold text-white/60">
              <span>{fmtDuration(cur)}</span>
              <span>{fmtDuration(dur || 0)}</span>
            </div>
          </div>

          <button
            onClick={() => setIsFullscreen(false)}
            aria-label="Exit fullscreen"
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/20 text-white/70 transition hover:text-white hover:bg-white/10 active:scale-95"
          >
            <ExitFullscreenIcon />
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // NORMAL (inline) VIEW
  // ─────────────────────────────────────────────────────────────────────────────
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
              {playing ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
            </button>
          </>
        )}

        {controls}
      </div>

      {/* VIDEO control bar */}
      {mediaType === "VIDEO" && (
        <div className="flex items-center justify-center gap-4 bg-[#0A1F17] py-3">
          <button
            onClick={toggle}
            aria-label={playing ? "Pause" : "Play"}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-gold-light text-gold-light transition hover:scale-105 active:scale-95"
          >
            {playing ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────

function PlayIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  );
}

function EnterFullscreenIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V4h3" />
      <path d="M21 7V4h-3" />
      <path d="M3 17v3h3" />
      <path d="M21 17v3h-3" />
    </svg>
  );
}

function ExitFullscreenIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4v3H3" />
      <path d="M18 4v3h3" />
      <path d="M6 20v-3H3" />
      <path d="M18 20v-3h3" />
    </svg>
  );
}
