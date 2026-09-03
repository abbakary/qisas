import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Info, ChevronLeft, ChevronRight, Eye, Heart } from "lucide-react";
import { useLang, pick } from "../context/LanguageContext";
import type { Lang } from "../lib/i18n";
import { db, type Series } from "../lib/mock/db";
import KhatamStar from "./KhatamStar";

export interface SlideItem {
  series: Series;
  firstEpisodeId?: string;
  badgeLabel: string;
  episodeCount?: number;
  theme: {
    bgGradient: string;
    border: string;
    badgeBg: string;
    accentColor: string;
  };
}

const INTERVAL = 3000; // ms per slide

export default function HomeHeroSlideshow({ items }: { items: SlideItem[] }) {
  const { lang } = useLang();
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [animKey, setAnimKey] = useState(0);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  // Progress through current slide [0-100]
  const [progress, setProgress] = useState(0);

  const total = items.length;
  const timerRef = useRef<number | null>(null);
  const progressRef = useRef<number | null>(null);
  const isPausedRef = useRef(false); // ref so timer callbacks always read latest value
  const startTimeRef = useRef<number>(Date.now());

  const clearTimers = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (progressRef.current) { cancelAnimationFrame(progressRef.current); progressRef.current = null; }
  }, []);

  const goTo = useCallback((idx: number, dir: "next" | "prev") => {
    setDirection(dir);
    setCurrentIndex(idx);
    setAnimKey((k) => k + 1);
    setProgress(0);
    startTimeRef.current = Date.now();
  }, []);

  // Tick: update progress bar every frame
  const tick = useCallback(() => {
    if (isPausedRef.current) {
      progressRef.current = requestAnimationFrame(tick);
      return;
    }
    const elapsed = Date.now() - startTimeRef.current;
    const pct = Math.min(100, (elapsed / INTERVAL) * 100);
    setProgress(pct);
    if (pct < 100) {
      progressRef.current = requestAnimationFrame(tick);
    }
  }, []);

  // Schedule next slide after INTERVAL
  const scheduleNext = useCallback(() => {
    clearTimers();
    startTimeRef.current = Date.now();
    setProgress(0);
    progressRef.current = requestAnimationFrame(tick);
    timerRef.current = window.setTimeout(() => {
      if (!isPausedRef.current) {
        setCurrentIndex((prev) => {
          const next = (prev + 1) % total;
          setDirection("next");
          setAnimKey((k) => k + 1);
          setProgress(0);
          startTimeRef.current = Date.now();
          return next;
        });
        scheduleNext();
      } else {
        // Check again after a short delay when paused
        timerRef.current = window.setTimeout(scheduleNext, 200);
      }
    }, INTERVAL);
  }, [clearTimers, tick, total]);

  // Start on mount, restart when total changes
  useEffect(() => {
    if (total <= 1) return;
    scheduleNext();
    return clearTimers;
  }, [total]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleMouseEnter() { isPausedRef.current = true; }
  function handleMouseLeave() {
    isPausedRef.current = false;
    // Reset the start time so progress continues from where it was
    startTimeRef.current = Date.now() - (progress / 100) * INTERVAL;
  }

  function handleNext() {
    isPausedRef.current = false;
    clearTimers();
    goTo((currentIndex + 1) % total, "next");
    scheduleNext();
  }

  function handlePrev() {
    isPausedRef.current = false;
    clearTimers();
    goTo((currentIndex - 1 + total) % total, "prev");
    scheduleNext();
  }

  function handleDotClick(idx: number) {
    isPausedRef.current = false;
    clearTimers();
    goTo(idx, idx > currentIndex ? "next" : "prev");
    scheduleNext();
  }

  function handleLike(e: React.MouseEvent, seriesId: string) {
    e.preventDefault();
    e.stopPropagation();
    db.series.toggleLike(seriesId);
    setLikedMap((prev) => ({ ...prev, [seriesId]: !prev[seriesId] }));
  }

  if (!items || total === 0) return null;

  const currentSlide = items[currentIndex];

  return (
    <section
      className="relative w-full px-4 sm:px-5 md:px-10 lg:px-16 pt-3 sm:pt-4 md:pt-6 pb-1"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="max-w-7xl mx-auto relative">

        {/* ── Prev arrow ── */}
        <button
          onClick={handlePrev}
          aria-label="Previous"
          className="absolute left-0.5 sm:left-1 top-1/2 -translate-y-1/2 z-20
            flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center
            rounded-full bg-black/40 text-white/90 border border-white/15
            backdrop-blur-sm shadow-lg cursor-pointer
            transition-all duration-150 hover:bg-gold hover:text-deep-green hover:scale-105 active:scale-95"
        >
          <ChevronLeft size={17} />
        </button>

        {/* ── Next arrow ── */}
        <button
          onClick={handleNext}
          aria-label="Next"
          className="absolute right-0.5 sm:right-1 top-1/2 -translate-y-1/2 z-20
            flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center
            rounded-full bg-black/40 text-white/90 border border-white/15
            backdrop-blur-sm shadow-lg cursor-pointer
            transition-all duration-150 hover:bg-gold hover:text-deep-green hover:scale-105 active:scale-95"
        >
          <ChevronRight size={17} />
        </button>

        {/* ── Slide viewport ── */}
        <div className="relative h-[180px] sm:h-[230px] md:h-[300px] lg:h-[360px] overflow-hidden rounded-2xl md:rounded-3xl shadow-xl">
          <SlideCard
            key={animKey}
            item={currentSlide}
            lang={lang}
            navigate={navigate}
            direction={direction}
            isLiked={likedMap[currentSlide.series.id]}
            onLike={(e) => handleLike(e, currentSlide.series.id)}
          />
        </div>

        {/* ── Dots with animated progress bar ── */}
        <div className="mt-3 md:mt-4 flex items-center justify-center gap-2">
          {items.map((item, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={item.series.id}
                onClick={() => handleDotClick(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`relative overflow-hidden rounded-full cursor-pointer transition-all duration-300 ${
                  isActive
                    ? "w-8 sm:w-10 md:w-12 h-1.5 bg-white/25"
                    : "w-1.5 h-1.5 bg-white/30 hover:bg-white/60"
                }`}
              >
                {isActive && (
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-gold"
                    style={{ width: `${progress}%`, transition: "width 0.05s linear" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── SlideCard ────────────────────────────────────────────────────────────────

function SlideCard({
  item,
  lang,
  navigate,
  direction,
  isLiked,
  onLike,
}: {
  item: SlideItem;
  lang: Lang;
  navigate: (path: string) => void;
  direction: "next" | "prev";
  isLiked?: boolean;
  onLike: (e: React.MouseEvent) => void;
}) {
  const { series, firstEpisodeId, badgeLabel } = item;
  const title = pick(lang, series.titleSw, series.title);
  const description = pick(lang, series.descriptionSw, series.description);

  function handlePlay(e: React.MouseEvent) {
    e.stopPropagation();
    navigate(firstEpisodeId ? `/player/${firstEpisodeId}` : `/series/${series.slug}`);
  }
  function handleInfo(e: React.MouseEvent) {
    e.stopPropagation();
    navigate(`/series/${series.slug}`);
  }

  // Direction-aware slide animation via inline style
  const animClass = direction === "next" ? "slide-enter-right" : "slide-enter-left";

  return (
    <div
      onClick={() => navigate(`/series/${series.slug}`)}
      className={`group relative h-full w-full cursor-pointer overflow-hidden
        rounded-2xl md:rounded-3xl
        bg-gradient-to-br from-deep-green via-teal to-[#0B251D]
        p-3 sm:p-5 md:p-8 flex flex-col justify-between
        shadow-md border border-white/10 text-warm-white
        ${animClass}`}
    >
      {/* Background artwork */}
      {series.image ? (
        <>
          <img
            src={series.image}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover object-[50%_30%]
              opacity-40 mix-blend-luminosity
              transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-deep-green/95 via-deep-green/55 to-transparent" />
          <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-deep-green/80 via-deep-green/30 to-transparent" />
        </>
      ) : (
        <div className="absolute right-6 top-6 opacity-20 pointer-events-none">
          <KhatamStar size={90} className="text-gold-light" />
        </div>
      )}

      {/* Top row */}
      <div className="relative z-10 flex items-center justify-between">
        <span className="rounded-lg bg-gold px-2.5 py-0.5 text-[8px] sm:text-[9.5px] md:text-[11px]
          font-extrabold tracking-widest text-deep-green uppercase shadow">
          {badgeLabel || "QISAS ORIGINAL"}
        </span>
        <button
          onClick={onLike}
          aria-label="Like"
          className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full
            backdrop-blur-sm border border-white/20 transition active:scale-90 cursor-pointer ${
            isLiked ? "bg-rose-600 text-white" : "bg-black/35 text-white/80 hover:text-white hover:bg-black/55"
          }`}
        >
          <Heart size={13} fill={isLiked ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Bottom content */}
      <div className="relative z-10 flex flex-col gap-1 md:gap-2 max-w-2xl">
        <div className="flex items-center gap-2 text-[9px] sm:text-[10px] md:text-xs text-gold-light/90 font-semibold">
          <span className="flex items-center gap-1">
            <Eye size={10} />
            {series.views ? `${(series.views / 1000).toFixed(1)}k` : "Maarufu"}
          </span>
          <span className="opacity-50">·</span>
          <span>{item.episodeCount ?? 8} {lang === "sw" ? "Vipindi" : "Eps"}</span>
        </div>

        <h3 className="font-display text-[16px] sm:text-2xl md:text-[32px] font-bold
          text-warm-white leading-tight line-clamp-1
          drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]
          group-hover:text-gold-light transition duration-200">
          {title}
        </h3>

        {description && (
          <p className="hidden sm:block text-[10px] md:text-[13px] text-warm-white/75
            line-clamp-2 leading-relaxed max-w-lg">
            {description}
          </p>
        )}

        <div className="mt-1.5 md:mt-3 flex items-center gap-2 sm:gap-3">
          <button
            onClick={handlePlay}
            className="flex items-center gap-1.5 rounded-full bg-gold hover:bg-gold-light
              text-deep-green px-3 sm:px-5 py-1 sm:py-1.5 md:py-2
              text-[10px] sm:text-[11px] md:text-xs font-extrabold
              shadow transition active:scale-95 cursor-pointer"
          >
            <Play size={11} fill="currentColor" />
            <span>{lang === "sw" ? "Tazama" : "Play Now"}</span>
          </button>

          <button
            onClick={handleInfo}
            className="flex items-center gap-1 rounded-full bg-white/12 hover:bg-white/22
              text-warm-white border border-white/25
              px-2.5 sm:px-4 py-1 sm:py-1.5 md:py-2
              text-[10px] sm:text-[11px] md:text-xs font-bold
              backdrop-blur-sm transition active:scale-95 cursor-pointer"
          >
            <Info size={11} />
            <span>{lang === "sw" ? "Zaidi" : "Info"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
