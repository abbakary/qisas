import React, { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useLang, pick } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { fmtDuration } from "../lib/content-rules";
import MediaPlayer from "../components/MediaPlayer";
import { db } from "../lib/mock/db";

export default function PlayerPage() {
  const { episodeId } = useParams<{ episodeId: string }>();
  const { lang, t } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"next" | "about">("next");

  const episode = episodeId ? db.episodes.findById(episodeId) : null;
  const series = episode ? db.series.findById(episode.seriesId) : null;

  const initialPosition = useMemo(() => {
    if (!user?.id || !episode?.id) return 0;
    const p = db.progress.find(user.id, episode.id);
    return p ? p.positionSec : 0;
  }, [user?.id, episode?.id]);

  const upNext = useMemo(() => {
    if (!series || !episode) return [];
    const all = db.episodes.findBySeries(series.id);
    return all
      .filter((e) => e.published && e.order > episode.order)
      .sort((a, b) => a.order - b.order);
  }, [series, episode]);

  if (!episode || !series) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#0A1F17] p-8 text-center text-warm-white">
        <p className="text-[14px] text-muted">Episode not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 rounded-xl bg-gold px-4 py-2 text-[12px] font-bold text-deep-green"
        >
          ← Back
        </button>
      </div>
    );
  }

  const seriesTitle = pick(lang, series.titleSw, series.title);
  const episodeTitle = pick(lang, episode.titleSw, episode.title);

  return (
    // Full-page dark shell — no scroll on the shell itself
    <div className="flex min-h-[100dvh] flex-col bg-[#0A1F17] text-warm-white">

      {/* ── TOP NAV BAR ── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-3 sm:px-5 py-2.5 border-b border-white/8">
        <button
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white/8 hover:bg-white/15 text-warm-white/80 hover:text-warm-white transition active:scale-95"
          aria-label="Back"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <Link
          to={`/series/${series.slug}`}
          className="flex-1 min-w-0 text-[12px] sm:text-[13px] font-bold text-gold-light hover:text-gold transition truncate"
        >
          {seriesTitle}
        </Link>
      </div>

      {/* ── VIDEO / AUDIO PLAYER ──
           w-full with no padding → touches both edges exactly like YouTube.
           aspect-ratio is enforced inside MediaPlayer for VIDEO.
           For mobile the whole width is used; on wide desktop we cap it sensibly.
      ── */}
      <div className="flex-shrink-0 w-full bg-black">
        <MediaPlayer
          key={episode.id}
          episodeId={episode.id}
          mediaUrl={episode.mediaUrl}
          mediaType={episode.mediaType}
          poster={series.image}
          initialPosition={initialPosition}
          onCompleted={() => {
            if (upNext[0]) navigate(`/player/${upNext[0].id}`);
          }}
        />
      </div>

      {/* ── SCROLLABLE CONTENT BELOW PLAYER ── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-4xl mx-auto w-full">

          {/* Episode title + meta */}
          <div className="px-4 sm:px-6 pt-4 pb-3 border-b border-white/8">
            <p className="text-[9.5px] sm:text-[10.5px] font-extrabold uppercase tracking-[0.07em] text-gold-light">
              {seriesTitle} &middot; {t("episode")} {String(episode.order).padStart(2, "0")}
            </p>
            <h1 className="mt-1 font-display text-[17px] sm:text-xl font-bold text-warm-white leading-snug">
              {episodeTitle}
            </h1>
            {episode.durationSec > 0 && (
              <p className="mt-1 text-[10px] text-muted font-medium">
                {fmtDuration(episode.durationSec)}
              </p>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-5 px-4 sm:px-6 border-b border-white/8">
            {(["next", "about"] as const).map((key) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`py-3 text-[11px] sm:text-xs font-bold transition cursor-pointer border-b-2 -mb-px ${
                  tab === key
                    ? "border-gold text-gold-light"
                    : "border-transparent text-muted hover:text-warm-white"
                }`}
              >
                {key === "next" ? t("upNext") : t("about")}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="px-4 sm:px-6 py-4 pb-16">
            {tab === "next" ? (
              upNext.length === 0 ? (
                <p className="text-[12px] text-muted py-4">
                  {lang === "sw" ? "Hiki ndicho kipindi cha mwisho." : "This is the last episode."}
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {upNext.map((e) => (
                    <Link
                      key={e.id}
                      to={`/player/${e.id}`}
                      className="group flex items-center gap-3 rounded-xl p-2 hover:bg-white/6 transition"
                    >
                      {/* Thumbnail / order badge */}
                      <div className="flex h-10 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal/60 to-deep-green text-[11px] font-bold text-warm-white shadow-sm group-hover:from-gold/80 group-hover:to-gold group-hover:text-deep-green transition">
                        {String(e.order).padStart(2, "0")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] sm:text-[13px] font-bold text-warm-white group-hover:text-gold-light transition line-clamp-1">
                          {pick(lang, e.titleSw, e.title)}
                        </p>
                        <p className="text-[9.5px] sm:text-[10.5px] text-muted mt-0.5">
                          {fmtDuration(e.durationSec)}
                        </p>
                      </div>
                      {/* Play icon */}
                      <div className="flex-shrink-0 text-muted group-hover:text-gold transition">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            ) : (
              <p className="text-[13px] sm:text-sm leading-relaxed text-[#B9B192]">
                {pick(lang, series.descriptionSw, series.description)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
