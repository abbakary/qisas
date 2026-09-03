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
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<number | null>(null);
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
    if (Date.now() - lastSaved.current > 4000) save(el.currentTime, false);
  };

  const onEnded = () => {
    setPlaying(false);
    setShowControls(true);
    save(ref.current?.duration ?? cur, true);
    onCompleted?.();
  };

  // Auto-hide controls after 3s of inactivity on video
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (mediaType === "VIDEO") {
      hideTimer.current = window.setTimeout(() => {
        if (playing) setShowControls(false);
      }, 3000);
    }
  }, [mediaType, playing]);

  useEffect(() => {
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, []);

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

  // Body scroll lock in fullscreen
  useEffect(() => {
    document.body.style.overflow = isFullscreen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isFullscreen]);

  // Escape key exits fullscreen
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") setIsFullscreen(false); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, []);

  function toggle() {
    const el = ref.current;
    if (!el) return;
    if (el.paused) { el.play().catch(() => {}); setPlaying(true); }
    else { el.pause(); setPlaying(false); save(el.currentTime, false); }
    resetHideTimer();
  }

  function seek(e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || !dur) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    el.currentTime = pct * dur;
    setCur(el.currentTime);
    resetHideTimer();
  }

  const pct = dur ? (cur / dur) * 100 : 0;

  // ── FULLSCREEN OVERLAY ────────────────────────────────────────────────────
  if (isFullscreen) {
    return (
      <div
        className="fixed inset-0 z-[9999] bg-black flex flex-col"
        onMouseMove={resetHideTimer}
        onTouchStart={resetHideTimer}
      >
        {mediaType === "VIDEO" ? (
          <div className="relative flex-1 bg-black flex items-center justify-center">
            <video
              ref={ref as React.RefObject<HTMLVideoElement>}
              src={mediaUrl}
              poster={poster ?? undefined}
              className="w-full h-full object-contain"
              onLoadedMetadata={onLoaded}
              onTimeUpdate={onTime}
              onEnded={onEnded}
              playsInline
            />

            {/* Tap area — toggle controls + play/pause on double-tap */}
            <div className="absolute inset-0 z-10" onClick={toggle} />

            {/* Controls overlay — auto-hides */}
            <div
              className={`absolute inset-0 z-20 flex flex-col justify-between transition-opacity duration-300 ${
                showControls ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              {/* Top bar */}
              <div className="flex items-center justify-end p-3 bg-gradient-to-b from-black/60 to-transparent">
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/50 text-white border border-white/20 backdrop-blur-sm active:scale-95"
                  aria-label="Exit fullscreen"
                >
                  <ExitFullscreenIcon />
                </button>
              </div>

              {/* Centre play/pause */}
              <div className="flex items-center justify-center">
                <button
                  onClick={toggle}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-black/50 text-white border border-white/25 backdrop-blur-sm active:scale-95"
                  aria-label={playing ? "Pause" : "Play"}
                >
                  {playing ? <PauseIcon size={28} /> : <PlayIcon size={28} />}
                </button>
              </div>

              {/* Bottom progress */}
              <div className="px-4 pb-6 pt-8 bg-gradient-to-t from-black/70 to-transparent">
                <div
                  className="h-1 cursor-pointer rounded-full bg-white/30 active:h-1.5"
                  onClick={seek}
                  onTouchEnd={seek as any}
                >
                  <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-2 flex justify-between text-[11px] font-bold text-white/70">
                  <span>{fmtDuration(cur)}</span>
                  <span>{fmtDuration(dur || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Audio fullscreen — "Now Playing" screen */
          <div className="relative flex-1 flex flex-col items-center justify-center bg-[#071912] overflow-hidden">
            {poster && (
              <>
                <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20 scale-110 blur-sm" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
              </>
            )}
            <audio
              ref={ref as React.RefObject<HTMLAudioElement>}
              src={mediaUrl}
              onLoadedMetadata={onLoaded}
              onTimeUpdate={onTime}
              onEnded={onEnded}
            />
            {poster && (
              <div className="relative z-10 mb-10 w-56 h-56 rounded-3xl overflow-hidden shadow-2xl ring-2 ring-gold/30">
                <img src={poster} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <button
              onClick={toggle}
              className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-gold text-deep-green shadow-xl active:scale-95 transition"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <PauseIcon size={32} /> : <PlayIcon size={32} />}
            </button>
            {/* Close */}
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-xl bg-black/40 text-white/80 border border-white/15 backdrop-blur-sm"
              aria-label="Exit fullscreen"
            >
              <ExitFullscreenIcon />
            </button>
          </div>
        )}

        {/* Fullscreen bottom bar (shared audio/video) */}
        <div className="flex-shrink-0 flex items-center gap-4 px-5 py-3 bg-black border-t border-white/10">
          <button
            onClick={toggle}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-gold-light text-gold-light active:scale-95"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
          </button>

          <div className="flex-1 min-w-0">
            <div
              className="h-1 cursor-pointer rounded-full bg-white/20"
              onClick={seek}
              onTouchEnd={seek as any}
            >
              <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] font-bold text-white/50">
              <span>{fmtDuration(cur)}</span>
              <span>{fmtDuration(dur || 0)}</span>
            </div>
          </div>

          <button
            onClick={() => setIsFullscreen(false)}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/15 text-white/70 active:scale-95"
            aria-label="Exit fullscreen"
          >
            <ExitFullscreenIcon />
          </button>
        </div>
      </div>
    );
  }

  // ── INLINE VIEW ───────────────────────────────────────────────────────────
  // Video: full-width, 16:9 aspect ratio — like YouTube
  // Audio: fixed height artwork panel
  if (mediaType === "VIDEO") {
    return (
      <div
        className="relative w-full bg-black"
        style={{ aspectRatio: "16/9" }}
        onMouseMove={resetHideTimer}
        onTouchStart={resetHideTimer}
      >
        <video
          ref={ref as React.RefObject<HTMLVideoElement>}
          src={mediaUrl}
          poster={poster ?? undefined}
          className="absolute inset-0 w-full h-full object-contain"
          onLoadedMetadata={onLoaded}
          onTimeUpdate={onTime}
          onEnded={onEnded}
          playsInline
        />

        {/* Tap to toggle controls */}
        <div className="absolute inset-0 z-10" onClick={toggle} />

        {/* Controls overlay */}
        <div
          className={`absolute inset-0 z-20 flex flex-col justify-between transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Top-right: fullscreen button */}
          <div className="flex justify-end p-2.5">
            <button
              onClick={(e) => { e.stopPropagation(); setIsFullscreen(true); }}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/55 text-white border border-white/15 backdrop-blur-sm active:scale-95 hover:bg-black/75 transition"
              aria-label="Enter fullscreen"
            >
              <EnterFullscreenIcon />
            </button>
          </div>

          {/* Centre: play/pause */}
          <div className="flex items-center justify-center">
            <button
              onClick={(e) => { e.stopPropagation(); toggle(); }}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 text-white border border-white/25 backdrop-blur-sm active:scale-95"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <PauseIcon size={24} /> : <PlayIcon size={24} />}
            </button>
          </div>

          {/* Bottom: scrubber */}
          <div className="px-3 pb-3 pt-8 bg-gradient-to-t from-black/65 to-transparent">
            <div
              className="h-1 cursor-pointer rounded-full bg-white/30"
              onClick={(e) => { e.stopPropagation(); seek(e); }}
            >
              <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-1.5 flex justify-between text-[9px] font-bold text-white/70">
              <span>{fmtDuration(cur)}</span>
              <span>{fmtDuration(dur || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Audio inline
  return (
    <div className="relative w-full h-[220px] overflow-hidden bg-[radial-gradient(circle_at_50%_40%,rgba(231,199,103,0.18),transparent_60%),linear-gradient(200deg,#164E44,#08201A)]">
      {poster && (
        <>
          <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_28%]" />
          <div className="absolute inset-0 bg-[#0A1F17]/60" />
        </>
      )}
      <audio
        ref={ref as React.RefObject<HTMLAudioElement>}
        src={mediaUrl}
        onLoadedMetadata={onLoaded}
        onTimeUpdate={onTime}
        onEnded={onEnded}
      />

      {/* Centre play button */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <button
          onClick={toggle}
          className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border-2 border-gold-light bg-black/40 text-gold-light backdrop-blur transition hover:scale-105 active:scale-95 shadow-lg"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <PauseIcon size={24} /> : <PlayIcon size={24} />}
        </button>
      </div>

      {/* Fullscreen button top-right */}
      <button
        onClick={() => setIsFullscreen(true)}
        className="absolute top-2.5 right-2.5 z-20 flex h-8 w-8 items-center justify-center rounded-xl bg-black/55 text-white/90 border border-white/15 backdrop-blur-sm transition hover:bg-black/75 active:scale-95"
        aria-label="Enter fullscreen"
      >
        <EnterFullscreenIcon />
      </button>

      {/* Progress bar */}
      <div className="absolute inset-x-4 bottom-3 z-20">
        <div className="h-[4px] cursor-pointer rounded-full bg-white/25 hover:h-[6px] transition-all" onClick={seek}>
          <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1.5 flex justify-between text-[9px] font-bold text-[#C7C0A4]">
          <span>{fmtDuration(cur)}</span>
          <span>{fmtDuration(dur || 0)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Icons ────────────────────────────────────────────────────────────────────

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
      <path d="M3 7V4h3" /><path d="M21 7V4h-3" />
      <path d="M3 17v3h3" /><path d="M21 17v3h-3" />
    </svg>
  );
}

function ExitFullscreenIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4v3H3" /><path d="M18 4v3h3" />
      <path d="M6 20v-3H3" /><path d="M18 20v-3h3" />
    </svg>
  );
}
