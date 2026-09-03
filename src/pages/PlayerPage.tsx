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
    return all.filter((e) => e.published && e.order > episode.order).sort((a, b) => a.order - b.order);
  }, [series, episode]);

  if (!episode || !series) {
    return (
      <div className="app-shell flex min-h-[100dvh] flex-col items-center justify-center bg-[#0A1F17] p-8 text-center text-warm-white">
        <p className="text-[14px] text-muted">Episode not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 rounded-xl bg-gold px-4 py-2 text-[12px] font-bold text-deep-green">
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="app-shell flex min-h-[100dvh] flex-col bg-[#0A1F17] text-warm-white">
      <div className="w-full max-w-4xl mx-auto flex flex-col flex-1 px-2 sm:px-4 md:px-6">
        <div className="flex items-center justify-between px-2 pt-3 md:pt-5 text-[13px]">
          <button
            onClick={() => navigate(-1)}
            className="cursor-pointer text-warm-white p-1 hover:text-gold transition text-lg"
            aria-label="Back"
          >
            ↓
          </button>
          <Link to={`/series/${series.slug}`} className="text-gold-light font-bold hover:underline text-sm md:text-base">
            {pick(lang, series.titleSw, series.title)}
          </Link>
          <span className="w-4" />
        </div>

        <div className="mt-2 w-full rounded-2xl overflow-hidden shadow-2xl">
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

        <div className="px-3 sm:px-4 py-4">
          <div className="text-[9.5px] md:text-xs font-extrabold uppercase tracking-[0.06em] text-gold-light">
            {pick(lang, series.titleSw, series.title)} · {t("episode")}{" "}
            {String(episode.order).padStart(2, "0")}
          </div>
          <h1 className="mt-1.5 font-display text-[17px] sm:text-xl font-bold text-warm-white">
            {pick(lang, episode.titleSw, episode.title)}
          </h1>
        </div>

        <div className="flex gap-5 border-b border-white/10 px-3 sm:px-4">
          <button
            onClick={() => setTab("next")}
            className={`cursor-pointer pb-2.5 text-[11px] md:text-xs font-bold transition ${
              tab === "next" ? "border-b-2 border-gold text-gold-light" : "text-muted hover:text-warm-white"
            }`}
          >
            {t("upNext")}
          </button>
          <button
            onClick={() => setTab("about")}
            className={`cursor-pointer pb-2.5 text-[11px] md:text-xs font-bold transition ${
              tab === "about" ? "border-b-2 border-gold text-gold-light" : "text-muted hover:text-warm-white"
            }`}
          >
            {t("about")}
          </button>
        </div>

        {tab === "next" ? (
          <div className="flex flex-col gap-2.5 px-3 sm:px-4 py-4 pb-12">
            {upNext.length === 0 && (
              <p className="text-[12px] text-muted">
                {lang === "sw" ? "Hiki ndicho kipindi cha mwisho." : "This is the last episode."}
              </p>
            )}
            {upNext.map((e) => (
              <Link key={e.id} to={`/player/${e.id}`} className="group flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition">
                <span className="flex h-[38px] w-[50px] flex-none items-center justify-center rounded-lg bg-gradient-to-br from-teal-light to-deep-green text-[11px] font-bold text-white shadow-xs group-hover:from-gold group-hover:to-gold-light group-hover:text-deep-green transition">
                  {e.order}
                </span>
                <span>
                  <span className="block text-[11.5px] md:text-xs font-bold text-warm-white group-hover:text-gold-light transition">
                    {String(e.order).padStart(2, "0")} · {pick(lang, e.titleSw, e.title)}
                  </span>
                  <span className="block text-[9px] md:text-[10px] text-muted">{fmtDuration(e.durationSec)}</span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-3 sm:px-4 py-4 text-[12px] md:text-sm leading-relaxed text-[#B9B192] pb-12">
            {pick(lang, series.descriptionSw, series.description)}
          </div>
        )}
      </div>
    </div>
  );
}
