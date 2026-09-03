import React from "react";
import { Link } from "react-router-dom";
import { gradientFor } from "../lib/gradients";
import { useLang, pick } from "../context/LanguageContext";
import KhatamStar from "./KhatamStar";
import { Eye, ArrowRight } from "lucide-react";

export type SeriesCardData = {
  slug: string;
  title: string;
  titleSw: string;
  description: string;
  descriptionSw: string;
  coverGradient: string;
  image: string | null;
  episodeCount: number;
  categoryName: string;
  categoryNameSw: string;
  views?: number;
  likes?: number;
  featured?: boolean;
};

export default function SeriesCard({
  s,
  layout = "standard",
}: {
  s: SeriesCardData;
  layout?: "standard" | "compact" | "horizontal";
}) {
  const { lang, t } = useLang();
  const title = pick(lang, s.titleSw, s.title);
  const description = pick(lang, s.descriptionSw, s.description);
  const category = pick(lang, s.categoryNameSw, s.categoryName);
  const viewsDisplay = s.views ? `${(s.views / 1000).toFixed(1)}K` : "1.2K";

  return (
    <Link
      to={`/series/${s.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-line shadow-sm hover:shadow-md transition duration-200"
    >
      {/* Top Banner with Islamic Gradient & Centered Title */}
      <div
        className="relative h-[100px] sm:h-[120px] md:h-[130px] w-full overflow-hidden flex flex-col justify-between p-2 sm:p-2.5 text-center"
        style={s.image ? undefined : { background: gradientFor(s.coverGradient) }}
      >
        {s.image ? (
          <>
            <img
              src={s.image}
              alt={title}
              className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/15" />
          </>
        ) : null}

        {/* Top: episode count badge */}
        <div className="relative z-10 flex items-center justify-end w-full">
          <span className="rounded-full bg-black/50 backdrop-blur-sm px-1.5 py-0.5 text-[8px] sm:text-[9.5px] font-bold text-white">
            {s.episodeCount} {lang === "sw" ? "Vipindi" : "Eps"}
          </span>
        </div>

        {/* Center: decorative star only — no title duplication */}
        <div className="relative z-10 flex items-center justify-center flex-1">
          <KhatamStar size={22} className="text-white/40 transition group-hover:scale-110 group-hover:text-gold-light/60" />
        </div>
      </div>

      {/* Card Body - White card with category, title, description */}
      <div className="flex flex-1 flex-col justify-between p-2 sm:p-3 bg-white">
        <div>
          <div className="text-[8px] sm:text-[9.5px] font-bold uppercase tracking-[0.06em] text-gold truncate">
            {category || "MANABII"}
          </div>

          <h3 className="mt-0.5 font-display text-[11px] sm:text-[13px] md:text-[13.5px] font-bold leading-snug text-ink group-hover:text-deep-green transition line-clamp-2">
            {title}
          </h3>

          <p className="mt-1 text-[10px] sm:text-[11px] text-muted leading-relaxed line-clamp-2 hidden sm:block">
            {description}
          </p>
          <p className="mt-1 text-[10px] text-muted leading-relaxed line-clamp-1 sm:hidden">
            {description}
          </p>
        </div>

        {/* Bottom subtle metadata */}
        <div className="mt-2 pt-1.5 border-t border-line/60 flex items-center justify-between text-[9px] sm:text-[10px] text-muted">
          <span className="flex items-center gap-0.5 font-medium">
            <Eye size={10} className="text-muted flex-shrink-0" />
            {viewsDisplay}
          </span>
          <span className="flex items-center gap-0.5 font-bold text-teal group-hover:text-deep-green transition">
            <span>{lang === "sw" ? "Tazama" : "Watch"}</span>
            <ArrowRight size={9} />
          </span>
        </div>
      </div>
    </Link>
  );
}
