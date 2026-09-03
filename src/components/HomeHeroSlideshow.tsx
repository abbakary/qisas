import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Info, ChevronLeft, ChevronRight, Eye, Heart } from "lucide-react";
import { useLang, pick } from "../context/LanguageContext";
import type { Lang } from "../lib/i18n";
import { useAuth } from "../context/AuthContext";
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

export default function HomeHeroSlideshow({ items }: { items: SlideItem[] }) {
  const { lang } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const timerRef = useRef<number | null>(null);

  const total = items.length;

  useEffect(() => {
    if (total <= 1 || isPaused) return;
    timerRef.current = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
      setAnimKey((k) => k + 1);
    }, 4500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, isPaused]);

  function handleNext() {
    setCurrentIndex((prev) => (prev + 1) % total);
    setAnimKey((k) => k + 1);
  }

  function handlePrev() {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
    setAnimKey((k) => k + 1);
  }

  function handleLike(e: React.MouseEvent, seriesId: string) {
    e.preventDefault();
    e.stopPropagation();
    db.series.toggleLike(seriesId);
    setLikedMap((prev) => ({ ...prev, [seriesId]: !prev[seriesId] }));
  }

  if (!items || items.length === 0) return null;

  const currentSlide = items[currentIndex];

  return (
    <section
      className="relative w-full px-4 sm:px-5 md:px-10 lg:px-16 pt-3 sm:pt-4 md:pt-6 pb-1"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto relative">
        {/* Navigation Arrow Controls */}
        <button
          onClick={handlePrev}
          aria-label="Previous Slide"
          className="absolute left-1 sm:left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-black/50 text-white/90 border border-white/20 backdrop-blur-sm transition hover:bg-gold hover:text-deep-green active:scale-95 shadow-md cursor-pointer"
        >
          <ChevronLeft size={16} />
        </button>

        <button
          onClick={handleNext}
          aria-label="Next Slide"
          className="absolute right-1 sm:right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-black/50 text-white/90 border border-white/20 backdrop-blur-sm transition hover:bg-gold hover:text-deep-green active:scale-95 shadow-md cursor-pointer"
        >
          <ChevronRight size={16} />
        </button>

        {/* Carousel Viewport */}
        <div className="relative h-[180px] sm:h-[220px] md:h-[300px] lg:h-[340px] overflow-hidden rounded-2xl md:rounded-3xl">
          <div
            key={animKey}
            className="h-full w-full slide-enter"
          >
            <SlideCard
              item={currentSlide}
              lang={lang}
              navigate={navigate}
              isLiked={likedMap[currentSlide.series.id]}
              onLike={(e) => handleLike(e, currentSlide.series.id)}
            />
          </div>
        </div>

        {/* Pagination Dots */}
        <div className="mt-2 md:mt-3.5 flex items-center justify-center gap-1.5 md:gap-2">
          {items.map((item, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={item.series.id}
                onClick={() => { setCurrentIndex(idx); setAnimKey((k) => k + 1); }}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  isActive
                    ? "w-5 sm:w-6 md:w-8 h-1.5 md:h-2 bg-gold shadow-sm"
                    : "w-1.5 md:w-2 h-1.5 md:h-2 bg-line hover:bg-muted"
                }`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SlideCard({
  item,
  lang,
  navigate,
  isLiked,
  onLike,
}: {
  item: SlideItem;
  lang: Lang;
  navigate: (path: string) => void;
  isLiked?: boolean;
  onLike: (e: React.MouseEvent) => void;
}) {
  const { series, firstEpisodeId, badgeLabel } = item;
  const title = pick(lang, series.titleSw, series.title);
  const description = pick(lang, series.descriptionSw, series.description);

  function handlePlayClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (firstEpisodeId) {
      navigate(`/player/${firstEpisodeId}`);
    } else {
      navigate(`/series/${series.slug}`);
    }
  }

  function handleInfoClick(e: React.MouseEvent) {
    e.stopPropagation();
    navigate(`/series/${series.slug}`);
  }

  return (
    <div
      onClick={() => navigate(`/series/${series.slug}`)}
      className="group relative h-full w-full cursor-pointer overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-deep-green via-teal to-[#0B251D] p-3 sm:p-4 md:p-7 flex flex-col justify-between shadow-md border border-line/40 text-warm-white"
    >
      {/* Artwork Poster */}
      {series.image ? (
        <>
          <img
            src={series.image}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover object-[50%_35%] opacity-35 mix-blend-luminosity group-hover:scale-105 transition duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-deep-green via-deep-green/60 to-transparent" />
          <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-deep-green via-deep-green/50 to-transparent" />
        </>
      ) : (
        <div className="absolute right-3 top-3 opacity-25">
          <KhatamStar size={70} className="text-gold-light" />
        </div>
      )}

      {/* Top Row: Badge & Like Button */}
      <div className="relative z-10 flex items-center justify-between">
        <span className="rounded-md md:rounded-lg bg-gold px-2 md:px-3 py-0.5 md:py-1 text-[8px] sm:text-[9.5px] md:text-xs font-extrabold tracking-wider text-deep-green uppercase shadow-sm">
          {badgeLabel || "QISAS ORIGINAL"}
        </span>

        <button
          onClick={onLike}
          aria-label="Like this series"
          className={`flex h-6 w-6 sm:h-7 sm:w-7 md:h-9 md:w-9 items-center justify-center rounded-full backdrop-blur-sm border border-white/20 transition active:scale-90 cursor-pointer ${
            isLiked ? "bg-rose-600 text-white" : "bg-black/40 text-white/80 hover:text-white"
          }`}
        >
          <Heart size={12} fill={isLiked ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Bottom Content */}
      <div className="relative z-10 flex flex-col gap-0.5 sm:gap-1 md:gap-2 max-w-2xl">
        <div className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10.5px] md:text-xs text-gold-light font-medium">
          <span className="flex items-center gap-1">
            <Eye size={11} />
            {series.views ? `${(series.views / 1000).toFixed(1)}k` : "Maarufu"}
          </span>
          <span>•</span>
          <span>{item.episodeCount || 8} {lang === "sw" ? "Vipindi" : "Eps"}</span>
        </div>

        <h3 className="font-display text-[15px] sm:text-xl md:text-3xl font-bold text-warm-white line-clamp-1 group-hover:text-gold-light transition drop-shadow">
          {title}
        </h3>

        {description && (
          <p className="hidden sm:block text-[10px] md:text-sm text-warm-white/80 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        <div className="mt-1 md:mt-2 flex items-center gap-2 md:gap-3">
          <button
            onClick={handlePlayClick}
            className="flex items-center gap-1 md:gap-2 rounded-full bg-gold hover:bg-gold-light text-deep-green px-3 md:px-5 py-1 md:py-2 text-[10px] md:text-xs font-extrabold shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Play size={11} fill="currentColor" />
            <span>{lang === "sw" ? "Tazama" : "Play Now"}</span>
          </button>

          <button
            onClick={handleInfoClick}
            className="flex items-center gap-1 md:gap-1.5 rounded-full bg-white/15 hover:bg-white/25 text-warm-white border border-white/30 px-2 md:px-4 py-1 md:py-2 text-[10px] md:text-xs font-bold backdrop-blur-sm transition active:scale-95 cursor-pointer"
          >
            <Info size={11} />
            <span>{lang === "sw" ? "Zaidi" : "Info"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
