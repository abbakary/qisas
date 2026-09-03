import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useLang, pick } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { db, toSeriesCard, subscribeDb } from "../lib/mock/db";
import SeriesCard, { type SeriesCardData } from "../components/SeriesCard";
import HomeHeroSlideshow, { type SlideItem } from "../components/HomeHeroSlideshow";
import { gradientFor } from "../lib/gradients";
import { Search, ChevronDown, Check, X, Play } from "lucide-react";

const SLIDE_THEMES = [
  {
    bgGradient: "from-deep-green via-teal to-[#082219]",
    border: "border-gold/40",
    badgeBg: "bg-gold",
    accentColor: "text-gold-light",
  },
  {
    bgGradient: "from-[#8A6E19] via-[#6B5310] to-[#2E2004]",
    border: "border-gold-light/40",
    badgeBg: "bg-gold",
    accentColor: "text-gold-light",
  },
  {
    bgGradient: "from-[#15665C] via-[#0F3D2E] to-[#0A2A20]",
    border: "border-teal-light/40",
    badgeBg: "bg-gold",
    accentColor: "text-gold-light",
  },
  {
    bgGradient: "from-[#1F493D] via-[#113127] to-[#071B14]",
    border: "border-emerald-500/40",
    badgeBg: "bg-gold",
    accentColor: "text-gold-light",
  },
];

type CW = {
  episodeId: string;
  order: number;
  positionSec: number;
  durationSec: number;
  seriesSlug: string;
  seriesTitle: string;
  seriesTitleSw: string;
  coverGradient: string;
  image: string | null;
};

export default function HomePage() {
  const { lang, toggle, t } = useLang();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeFilter, setActiveFilter] = useState<"popular" | "new" | "category">("popular");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [, setDbVersion] = useState(0);

  const queryParam = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(queryParam);

  useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);

  useEffect(() => {
    return subscribeDb(() => setDbVersion((v) => v + 1));
  }, []);

  const allCategories = useMemo(() => {
    return db.categories.findMany();
  }, []);

  const allPublished = useMemo(() => {
    return db.series.findMany({ published: true });
  }, []);

  // Filtered series
  const filteredSeries: SeriesCardData[] = useMemo(() => {
    let list = [...allPublished];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.titleSw.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.descriptionSw.toLowerCase().includes(q)
      );
    } else {
      if (selectedCategoryId) {
        list = list.filter((s) => s.categoryId === selectedCategoryId);
      } else if (activeFilter === "new") {
        list = [...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
      } else {
        // popular
        list = [...list].sort((a, b) => (b.views || 0) - (a.views || 0));
      }
    }

    return list.map(toSeriesCard);
  }, [allPublished, searchQuery, activeFilter, selectedCategoryId]);

  // Slideshow items
  const slideshowItems: SlideItem[] = useMemo(() => {
    const featuredList = allPublished.filter((s) => s.featured || (s.views || 0) > 3000).slice(0, 5);
    return featuredList.map((s, idx) => {
      const eps = db.episodes.findBySeries(s.id);
      const firstEp = eps.find((e) => e.published);
      return {
        series: s,
        firstEpisodeId: firstEp?.id,
        badgeLabel: idx % 2 === 0 ? "QISAS ORIGINAL" : (lang === "sw" ? "INAYOVUMA" : "TRENDING"),
        episodeCount: eps.length,
        theme: SLIDE_THEMES[idx % SLIDE_THEMES.length],
      };
    });
  }, [allPublished, lang]);

  // Continue watching
  const continueWatching: CW[] = useMemo(() => {
    if (!user?.id) return [];
    const progressRows = db.progress.findMany(user.id, { completed: false }).slice(0, 4);
    return progressRows.flatMap((p) => {
      const episode = db.episodes.findById(p.episodeId);
      if (!episode) return [];
      const ser = db.series.findById(episode.seriesId);
      if (!ser) return [];
      const category = db.categories.findById(ser.categoryId);
      return [
        {
          episodeId: episode.id,
          order: episode.order,
          positionSec: p.positionSec,
          durationSec: episode.durationSec,
          seriesSlug: ser.slug,
          seriesTitle: ser.title,
          seriesTitleSw: ser.titleSw,
          coverGradient: ser.coverGradient,
          image: ser.image ?? category?.image ?? null,
        },
      ];
    });
  }, [user?.id]);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setSearchQuery(val);
    setSearchParams(val ? { q: val } : {});
  }

  function clearSearch() {
    setSearchQuery("");
    setSearchParams({});
  }

  const selectedCategory = selectedCategoryId
    ? allCategories.find((c) => c.id === selectedCategoryId)
    : null;

  return (
    <div className="flex-1 flex flex-col bg-warm-white">
      {/* 1. Deep Green Header */}
      <header className="bg-deep-green px-4 sm:px-5 md:px-10 lg:px-16 pb-4 md:pb-7 pt-4 md:pt-6 text-warm-white shadow-md rounded-b-[24px] sm:rounded-b-3xl">
        <div className="max-w-7xl mx-auto w-full">
          {/* Top row: greeting + lang toggle */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[9px] sm:text-[10.5px] md:text-xs uppercase tracking-[0.06em] text-gold-light font-bold">
                ASSALAMU ALAYKUM
              </div>
              <h1 className="font-display text-[18px] sm:text-[22px] md:text-3xl font-bold text-white mt-0.5 leading-tight">
                {user?.name || "Karibu"}
              </h1>
            </div>
            <button
              onClick={toggle}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-bold text-gold-light hover:bg-white/20 transition cursor-pointer flex-shrink-0"
            >
              {lang === "sw" ? "EN" : "SW"}
            </button>
          </div>

          {/* Search bar — full width on mobile */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={lang === "sw" ? "Tafuta hadithi..." : "Search stories..."}
              className="w-full rounded-xl bg-white/10 pl-9 pr-8 py-2.5 text-[13px] text-warm-white placeholder:text-white/50 outline-none border border-white/15 focus:border-gold-light focus:bg-white/15 transition"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-0.5 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Continuous Hero Slideshow (matching user request & styled in authentic theme) */}
      {!searchQuery && slideshowItems.length > 0 && (
        <HomeHeroSlideshow items={slideshowItems} />
      )}

      {/* 3. Continue Watching (if active) */}
      {!searchQuery && continueWatching.length > 0 && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-5 md:px-10 lg:px-16 pt-3 md:pt-5 pb-1">
          <div className="text-[9.5px] sm:text-[10.5px] md:text-xs font-bold uppercase tracking-[0.05em] text-muted mb-2">
            {t("continueWatching")}
          </div>
          <div className="flex gap-2 sm:gap-2.5 md:gap-3.5 overflow-x-auto no-scrollbar pb-1">
            {continueWatching.map((c) => (
              <Link
                key={c.episodeId}
                to={`/player/${c.episodeId}`}
                className="flex-shrink-0 w-[120px] sm:w-[140px] md:w-[180px] rounded-xl bg-white border border-line p-2 shadow-sm hover:shadow transition"
              >
                <div
                  className="relative h-[56px] sm:h-[68px] md:h-[84px] w-full rounded-lg overflow-hidden flex items-center justify-center"
                  style={c.image ? undefined : { background: gradientFor(c.coverGradient) }}
                >
                  {c.image && (
                    <img src={c.image} alt="" className="h-full w-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="h-6 w-6 rounded-full bg-gold flex items-center justify-center text-deep-green shadow">
                      <Play size={11} fill="currentColor" />
                    </div>
                  </div>
                </div>
                <div className="mt-1.5 font-display text-[11px] sm:text-[12px] md:text-[13px] font-bold text-ink line-clamp-1">
                  {pick(lang, c.seriesTitleSw, c.seriesTitle)}
                </div>
                <div className="text-[9px] sm:text-[10px] md:text-[11px] text-muted">
                  {t("episode")} {c.order}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 4. Filter Pills Row */}
      {!searchQuery && (
        <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-5 md:px-10 lg:px-16 pt-3 md:pt-4 pb-1">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
            {/* Maarufu */}
            <button
              onClick={() => {
                setActiveFilter("popular");
                setSelectedCategoryId(null);
              }}
              className={`flex-shrink-0 rounded-full px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold transition cursor-pointer ${
                activeFilter === "popular" && !selectedCategoryId
                  ? "bg-gold text-deep-green shadow-sm"
                  : "bg-sand text-ink hover:bg-[#e6dcb9]"
              }`}
            >
              {lang === "sw" ? "Maarufu" : "Popular"}
            </button>

            {/* Mpya */}
            <button
              onClick={() => {
                setActiveFilter("new");
                setSelectedCategoryId(null);
              }}
              className={`flex-shrink-0 rounded-full px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold transition cursor-pointer ${
                activeFilter === "new" && !selectedCategoryId
                  ? "bg-gold text-deep-green shadow-sm"
                  : "bg-sand text-ink hover:bg-[#e6dcb9]"
              }`}
            >
              {lang === "sw" ? "Mpya" : "New"}
            </button>

            {/* Aina ▾ Dropdown */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                className={`flex items-center gap-1 rounded-full px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold transition cursor-pointer ${
                  selectedCategoryId
                    ? "bg-gold text-deep-green shadow-sm"
                    : "bg-sand text-ink hover:bg-[#e6dcb9]"
                }`}
              >
                <span>
                  {selectedCategory
                    ? pick(lang, selectedCategory.nameSw, selectedCategory.name)
                    : (lang === "sw" ? "Aina" : "Category")}
                </span>
                <ChevronDown size={12} />
              </button>

              {/* Dropdown Menu */}
              {categoryDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 z-30 min-w-[160px] rounded-2xl bg-white border border-line p-1.5 shadow-xl animate-in fade-in">
                  <button
                    onClick={() => {
                      setSelectedCategoryId(null);
                      setCategoryDropdownOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold rounded-xl transition cursor-pointer ${
                      !selectedCategoryId ? "bg-sand text-deep-green font-bold" : "text-ink hover:bg-warm-white"
                    }`}
                  >
                    <span>{lang === "sw" ? "Zote (All)" : "All Categories"}</span>
                    {!selectedCategoryId && <Check size={13} className="text-deep-green" />}
                  </button>

                  {allCategories.map((c) => {
                    const isSelected = selectedCategoryId === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedCategoryId(c.id);
                          setActiveFilter("category");
                          setCategoryDropdownOpen(false);
                        }}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold rounded-xl transition cursor-pointer ${
                          isSelected ? "bg-sand text-deep-green font-bold" : "text-ink hover:bg-warm-white"
                        }`}
                      >
                        <span>{pick(lang, c.nameSw, c.name)}</span>
                        {isSelected && <Check size={13} className="text-deep-green" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Section Heading: "Maarufu wiki hii" | Count: 51 (matching Screenshot 2) */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between px-4 sm:px-5 md:px-10 lg:px-16 pt-3 md:pt-5 pb-2">
        <h2 className="font-display text-[15px] sm:text-[17px] md:text-xl font-bold text-ink">
          {searchQuery
            ? `${lang === "sw" ? "Matokeo ya" : "Results for"} “${searchQuery}”`
            : selectedCategory
            ? pick(lang, selectedCategory.nameSw, selectedCategory.name)
            : activeFilter === "new"
            ? (lang === "sw" ? "Msururu Mpya" : "New Releases")
            : (lang === "sw" ? "Maarufu wiki hii" : "Popular this week")}
        </h2>
        <span className="text-[10px] sm:text-[11px] md:text-sm font-bold text-muted bg-sand px-2 py-0.5 rounded-full">
          {filteredSeries.length}
        </span>
      </div>

      {/* 6. Series Cards Grid (matching Screenshot 2 on phone, responsive 2-5 cols on desktop) */}
      {filteredSeries.length === 0 ? (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-5 py-12 text-center">
          <p className="text-[13px] text-muted">
            {lang === "sw" ? "Hakuna hadithi iliyopatikana." : "No stories found."}
          </p>
          <button
            onClick={() => {
              clearSearch();
              setSelectedCategoryId(null);
              setActiveFilter("popular");
            }}
            className="mt-3 rounded-xl bg-sand px-4 py-2 text-[12px] font-bold text-deep-green hover:bg-[#e4dbbe] transition cursor-pointer"
          >
            {lang === "sw" ? "Ona Zote" : "Show All"}
          </button>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-5 md:px-10 lg:px-16 pb-24 sm:pb-16">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4 md:gap-5">
            {filteredSeries.map((s) => (
              <SeriesCard key={s.slug} s={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


