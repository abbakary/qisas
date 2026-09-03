import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useLang, pick } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { gradientFor } from "../lib/gradients";
import { avgDuration, fmtDuration } from "../lib/content-rules";
import { db, subscribeDb, type Episode, type Comment } from "../lib/mock/db";
import ShareModal from "../components/ShareModal";
import {
  Play,
  Share2,
  MessageSquare,
  Heart,
  ArrowLeft,
  Eye,
  Film,
  Send,
  CornerDownRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  Check,
} from "lucide-react";

export default function SeriesDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { lang, t } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dbVersion, setDbVersion] = useState(0);

  // User interactions state
  const [likesCount, setLikesCount] = useState<number>(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareData, setShareData] = useState<{ title: string; url: string }>({ title: "", url: "" });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Comment input state
  const [commentText, setCommentText] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});

  // Mobile active tab: 'episodes' | 'comments'
  const [mobileTab, setMobileTab] = useState<"episodes" | "comments">("episodes");

  useEffect(() => {
    return subscribeDb(() => setDbVersion((v) => v + 1));
  }, []);

  const series = slug ? db.series.findBySlug(slug) : null;
  const category = series ? db.categories.findById(series.categoryId) : null;

  useEffect(() => {
    if (series) {
      setLikesCount(series.likes || 215);
    }
  }, [series?.id]);

  const isFavorited = useMemo(() => {
    if (!user?.id || !series?.id) return false;
    return !!db.favorites.find(user.id, series.id);
  }, [user?.id, series?.id, dbVersion]);

  const rawEpisodes: Episode[] = useMemo(() => {
    if (!series?.id) return [];
    return db.episodes.findBySeries(series.id);
  }, [series?.id, dbVersion]);

  // Root comments (parentId is null or undefined)
  const rootComments: Comment[] = useMemo(() => {
    if (!series?.id) return [];
    return db.comments.findMany({ seriesId: series.id, parentId: null });
  }, [series?.id, dbVersion]);

  // All comments count for badge
  const allCommentsCount = useMemo(() => {
    if (!series?.id) return 0;
    return db.comments.findMany({ seriesId: series.id }).length;
  }, [series?.id, dbVersion]);

  function getRepliesForComment(commentId: string): Comment[] {
    if (!series?.id) return [];
    return db.comments.findMany({ seriesId: series.id, parentId: commentId });
  }

  function toggleFav() {
    if (!user?.id || !series?.id) return;
    db.favorites.toggle(user.id, series.id);
  }

  function handleLikeSeries() {
    if (!series?.id) return;
    const newLikes = db.series.toggleLike(series.id);
    setLikesCount(newLikes || likesCount + 1);
    setHasLiked(true);
    showToast(lang === "sw" ? "Umeipenda hadithi hii! ♥" : "Liked! ♥");
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }

  function handleShareSeries() {
    if (!series) return;
    const url = window.location.href;
    const title = pick(lang, series.titleSw, series.title);
    setShareData({ title, url });
    setShareModalOpen(true);
  }

  function handleShareEpisode(ep: Episode, e: React.MouseEvent) {
    e.stopPropagation();
    if (!series) return;
    const url = `${window.location.origin}/player/${ep.id}`;
    const title = `${pick(lang, series.titleSw, series.title)} - ${pick(lang, ep.titleSw, ep.title)}`;
    setShareData({ title, url });
    setShareModalOpen(true);
  }

  function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || !series?.id) return;

    db.comments.create({
      seriesId: series.id,
      userId: user?.id || "guest",
      userName: user?.name || (lang === "sw" ? "Mgeni Rasmi" : "Guest Viewer"),
      userPhone: user?.phone || "+255700000000",
      text: commentText.trim(),
      likes: 0,
    });

    setCommentText("");
    showToast(lang === "sw" ? "Maoni yametumwa!" : "Comment posted!");
  }

  function handleAddReply(parentId: string) {
    if (!replyText.trim() || !series?.id) return;

    db.comments.create({
      seriesId: series.id,
      parentId,
      userId: user?.id || "guest",
      userName: user?.name || (lang === "sw" ? "Mgeni Rasmi" : "Guest Viewer"),
      userPhone: user?.phone || "+255700000000",
      text: replyText.trim(),
      likes: 0,
    });

    setReplyText("");
    setReplyingToId(null);
    setExpandedReplies((prev) => ({ ...prev, [parentId]: true }));
    showToast(lang === "sw" ? "Jibu limetumwa!" : "Reply posted!");
  }

  function handleLikeComment(commentId: string) {
    db.comments.toggleLike(commentId);
  }

  function toggleExpandReplies(commentId: string) {
    setExpandedReplies((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  }

  if (!series) {
    return (
      <div className="max-w-7xl mx-auto w-full p-12 text-center text-warm-white">
        <p className="text-muted">{lang === "sw" ? "Msururu haujapatikana." : "Series not found."}</p>
        <button
          onClick={() => navigate("/home")}
          className="mt-4 rounded-full bg-[#F3B728] px-5 py-2 text-xs font-black text-[#07130E] hover:bg-[#ffd166] transition shadow"
        >
          ← {lang === "sw" ? "Rudi Mwanzo" : "Back to Home"}
        </button>
      </div>
    );
  }

  const publishedEps = rawEpisodes.filter((e) => e.published);
  const firstPlayable = publishedEps[0];
  const viewsDisplay = series.views ? `${(series.views / 1000).toFixed(1)}K` : "2.1K";

  return (
    <div className="flex-1 w-full text-ink pb-24 md:pb-10">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 rounded-2xl bg-deep-green border border-gold-light text-warm-white px-4 py-2.5 text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check size={16} className="text-gold" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Share Dialog Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title={shareData.title}
        url={shareData.url}
        onCopySuccess={() => showToast(lang === "sw" ? "Kiungo kimenakiliwa!" : "Link copied!")}
      />

      {/* 1. Hero Showcase Banner with Authentic Deep Green Gradient */}
      <div className="relative w-full overflow-hidden bg-gradient-to-b from-[#0F3D2E] via-[#0F3D2E] to-[#124233] text-warm-white rounded-b-3xl shadow-md">
        {/* Backdrop Art & Subtle Overlay */}
        {series.image ? (
          <div className="absolute inset-0">
            <img
              src={series.image}
              alt=""
              className="h-full w-full object-cover object-[50%_35%] opacity-25 blur-[1.5px] scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-deep-green via-deep-green/80 to-transparent" />
          </div>
        ) : (
          <div
            className="absolute inset-0 opacity-30"
            style={{ background: gradientFor(series.coverGradient) }}
          />
        )}

        {/* Content Container inside Banner */}
        <div className="relative z-10 max-w-7xl mx-auto w-full px-5 md:px-10 lg:px-16 pt-5 pb-6 sm:pb-10">
          {/* Top Bar Navigation: Back button (left) and Favorite Heart button (right) */}
          <div className="flex items-center justify-between pb-4 sm:pb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/15 text-warm-white border border-white/20 backdrop-blur-sm hover:bg-white/25 hover:scale-105 transition active:scale-95 shadow-sm"
              aria-label="Back"
            >
              <ArrowLeft size={16} />
            </button>

            <button
              onClick={toggleFav}
              className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full backdrop-blur-sm border border-white/20 transition active:scale-95 shadow-sm ${
                isFavorited
                  ? "bg-rose-600 text-white"
                  : "bg-white/15 text-warm-white hover:bg-white/25"
              }`}
              aria-label={t("save")}
              title={isFavorited ? "Saved to Library" : "Save to Library"}
            >
              <Heart size={16} fill={isFavorited ? "currentColor" : "none"} />
            </button>
          </div>

          {/* Hero Information */}
          <div className="space-y-2.5">
            {/* Category Tag */}
            <div className="inline-flex items-center gap-1.5 rounded-full bg-gold px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-deep-green shadow-sm">
              <Sparkles size={11} />
              {pick(lang, category?.nameSw ?? "Jumla", category?.name ?? "General")}
            </div>

            {/* Title */}
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white drop-shadow-sm leading-tight">
              {pick(lang, series.titleSw, series.title)}
            </h1>

            {/* Metadata row: Views & Episodes */}
            <div className="flex items-center gap-2.5 text-xs font-semibold text-gold-light">
              <span className="flex items-center gap-1 bg-black/25 px-2.5 py-0.5 rounded-full border border-white/10">
                <Eye size={12} className="text-gold" />
                {viewsDisplay} {lang === "sw" ? "watazamaji" : "views"}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 bg-black/25 px-2.5 py-0.5 rounded-full border border-white/10">
                <Film size={12} className="text-emerald-300" />
                {publishedEps.length} {lang === "sw" ? "Vipindi" : "Episodes"}
              </span>
            </div>

            {/* Description */}
            <p className="text-xs text-[#cfc9ae] leading-relaxed max-w-2xl pt-0.5">
              {pick(lang, series.descriptionSw, series.description)}
            </p>

            {/* User Interaction Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              {/* Play Button */}
              {firstPlayable && (
                <button
                  onClick={() => navigate(`/player/${firstPlayable.id}`)}
                  className="flex items-center gap-1.5 rounded-full bg-gold hover:bg-gold-light text-deep-green px-5 py-2 text-xs font-black shadow-md hover:scale-105 active:scale-95 transition cursor-pointer"
                >
                  <Play size={14} fill="currentColor" />
                  <span>{lang === "sw" ? "Tazama Sasa" : "Play"}</span>
                </button>
              )}

              {/* Share Button */}
              <button
                onClick={handleShareSeries}
                className="flex items-center gap-1.5 rounded-full bg-white/15 hover:bg-white/25 text-warm-white border border-white/20 px-3.5 py-2 text-xs font-bold backdrop-blur-sm transition cursor-pointer"
              >
                <Share2 size={13} />
                <span>{lang === "sw" ? "Shiriki" : "Share"}</span>
              </button>

              {/* Comments Button */}
              <button
                onClick={() => {
                  setMobileTab("comments");
                  const el = document.getElementById("comments-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex items-center gap-1.5 rounded-full bg-white/15 hover:bg-white/25 text-warm-white border border-white/20 px-3.5 py-2 text-xs font-bold backdrop-blur-sm transition cursor-pointer"
              >
                <MessageSquare size={13} />
                <span>
                  {lang === "sw" ? "Maoni" : "Comments"} ({allCommentsCount})
                </span>
              </button>

              {/* Like Button */}
              <button
                onClick={handleLikeSeries}
                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold backdrop-blur-sm transition cursor-pointer ${
                  hasLiked
                    ? "bg-rose-600 border-rose-500 text-white"
                    : "bg-white/15 hover:bg-white/25 text-warm-white border-white/20"
                }`}
              >
                <Heart size={13} fill={hasLiked ? "currentColor" : "none"} />
                <span>{likesCount}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Tab Switcher (hidden on desktop) */}
      <div className="lg:hidden flex border-b border-line px-5 bg-white sticky top-0 z-30 shadow-xs">
        <button
          onClick={() => setMobileTab("episodes")}
          className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition cursor-pointer ${
            mobileTab === "episodes"
              ? "border-gold text-deep-green"
              : "border-transparent text-muted hover:text-ink"
          }`}
        >
          {lang === "sw" ? "Vipindi" : "Episodes"} ({publishedEps.length})
        </button>
        <button
          onClick={() => setMobileTab("comments")}
          className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition cursor-pointer ${
            mobileTab === "comments"
              ? "border-gold text-deep-green"
              : "border-transparent text-muted hover:text-ink"
          }`}
        >
          {lang === "sw" ? "Maoni" : "Comments"} ({allCommentsCount})
        </button>
      </div>

      {/* Content Section on Warm White Background */}
      <div className="max-w-7xl mx-auto w-full px-5 md:px-10 lg:px-16 pt-6 pb-16">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 space-y-6 lg:space-y-0">
          {/* ================= EPISODES ================= */}
          <div
            className={`space-y-3.5 lg:col-span-7 ${
              mobileTab === "comments" ? "hidden lg:block" : "block"
            }`}
          >
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <span className="h-4 w-1 rounded-full bg-gold" />
                <h2 className="font-display text-base font-bold text-ink">
                  {lang === "sw" ? "Orodha ya Vipindi" : "Episodes List"} ({publishedEps.length})
                </h2>
              </div>
              <span className="text-[11px] text-muted">
                {lang === "sw" ? "Chagua kuanza" : "Select to play"}
              </span>
            </div>

            {/* Episodes List */}
            {publishedEps.length === 0 ? (
              <div className="rounded-2xl border border-line bg-white p-8 text-center text-muted text-xs shadow-sm">
                {lang === "sw" ? "Hakuna vipindi vilivyochapishwa bado." : "No episodes published yet."}
              </div>
            ) : (
              <div className="space-y-3">
                {publishedEps.map((ep) => {
                  const durationFormatted = ep.durationSec
                    ? fmtDuration(ep.durationSec)
                    : "09:19";
                  const epTitle = pick(lang, ep.titleSw, ep.title);
                  const epDesc = pick(
                    lang,
                    ep.descriptionSw || series.descriptionSw,
                    ep.description || series.description
                  );

                  return (
                    <div
                      key={ep.id}
                      onClick={() => navigate(`/player/${ep.id}`)}
                      className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-2xl bg-white hover:bg-sand/30 border border-line hover:border-gold/60 transition duration-200 cursor-pointer shadow-sm hover:shadow"
                    >
                      {/* Left: Thumbnail */}
                      <div className="relative w-full sm:w-36 aspect-video flex-shrink-0 rounded-xl overflow-hidden bg-[#0F3D2E]">
                        <img
                          src={ep.posterUrl || series.image || "/media/series/musa-as.jpg"}
                          alt={epTitle}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

                        {/* Duration Pill at bottom right */}
                        <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-bold text-white">
                          {durationFormatted}
                        </span>

                        {/* Center Play Button */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-deep-green group-hover:scale-110 shadow transition">
                            <Play size={12} fill="currentColor" />
                          </div>
                        </div>
                      </div>

                      {/* Right: Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="rounded bg-sand px-2 py-0.5 text-[9px] font-bold text-deep-green uppercase">
                              EP {ep.order}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[8.5px] font-bold uppercase ${
                                ep.isFree
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {ep.isFree ? (lang === "sw" ? "Bure" : "Free") : "VIP"}
                            </span>
                          </div>

                          <h3 className="mt-1 font-display text-[13.5px] font-bold text-ink group-hover:text-deep-green transition line-clamp-1">
                            {epTitle}
                          </h3>

                          <p className="mt-0.5 text-[11px] text-muted leading-relaxed line-clamp-2">
                            {epDesc}
                          </p>
                        </div>

                        <div className="mt-2 pt-1.5 border-t border-line/60 flex items-center justify-between text-[10px] text-muted">
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {durationFormatted}
                          </span>

                          <button
                            onClick={(e) => handleShareEpisode(ep, e)}
                            className="flex items-center gap-1 p-0.5 text-muted hover:text-deep-green transition cursor-pointer"
                            title="Share Episode"
                          >
                            <Share2 size={12} />
                            <span>{lang === "sw" ? "Shiriki" : "Share"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ================= COMMENTS ================= */}
          <div
            id="comments-section"
            className={`space-y-4 lg:col-span-5 ${
              mobileTab === "episodes" ? "hidden lg:block" : "block"
            }`}
          >
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <span className="h-4 w-1 rounded-full bg-gold" />
                <h2 className="font-display text-base font-bold text-ink">
                  {lang === "sw" ? "Maoni ya Wasikilizaji" : "Comments"} ({allCommentsCount})
                </h2>
              </div>
              <span className="text-[11px] text-teal font-semibold">
                {lang === "sw" ? "Toa maoni yako" : "Share thoughts"}
              </span>
            </div>

            {/* Comment Form */}
            <form
              onSubmit={handleAddComment}
              className="relative flex items-center rounded-2xl bg-white border border-line p-1.5 focus-within:border-gold transition shadow-sm"
            >
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={lang === "sw" ? "Andika maoni yako hapa..." : "Add a comment..."}
                className="w-full bg-transparent px-3 py-1.5 text-xs text-ink placeholder:text-muted outline-none"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-deep-green hover:bg-teal text-warm-white disabled:opacity-40 transition shadow-xs cursor-pointer"
                title="Post comment"
              >
                <Send size={13} />
              </button>
            </form>

            {/* List of Comments */}
            {rootComments.length === 0 ? (
              <div className="rounded-2xl border border-line bg-white p-8 text-center text-muted text-xs shadow-sm">
                <MessageSquare size={22} className="mx-auto mb-2 text-muted/50" />
                <p>
                  {lang === "sw"
                    ? "Kuwa wa kwanza kutoa maoni kwa hadithi hii!"
                    : "Be the first to share your thoughts on this series!"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {rootComments.map((cmt) => {
                  const replies = getRepliesForComment(cmt.id);
                  const isReplying = replyingToId === cmt.id;
                  const isExpanded = expandedReplies[cmt.id] ?? true;

                  return (
                    <div
                      key={cmt.id}
                      className="rounded-2xl bg-white border border-line p-3.5 space-y-2 shadow-sm text-ink"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sand font-display text-[11px] font-bold text-deep-green shadow-xs">
                            {cmt.userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-[12px] font-bold text-ink">
                              {cmt.userName}
                            </div>
                            <div className="text-[9.5px] text-muted">
                              {new Date(cmt.createdAt).toLocaleDateString(
                                lang === "sw" ? "sw-TZ" : "en-US",
                                { month: "short", day: "numeric" }
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleLikeComment(cmt.id)}
                          className="flex items-center gap-1 text-[11px] text-muted hover:text-rose-600 transition cursor-pointer"
                        >
                          <Heart size={12} />
                          <span>{cmt.likes || 0}</span>
                        </button>
                      </div>

                      <p className="text-[12px] text-ink/90 leading-relaxed pl-9">
                        {cmt.text}
                      </p>

                      <div className="flex items-center justify-between pl-9 pt-0.5 text-[10.5px]">
                        <button
                          onClick={() => setReplyingToId(isReplying ? null : cmt.id)}
                          className="text-teal hover:text-deep-green font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <CornerDownRight size={11} />
                          <span>{lang === "sw" ? "Jibu" : "Reply"}</span>
                        </button>

                        {replies.length > 0 && (
                          <button
                            onClick={() => toggleExpandReplies(cmt.id)}
                            className="text-muted hover:text-ink flex items-center gap-1 cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            <span>
                              {replies.length}{" "}
                              {replies.length === 1
                                ? lang === "sw"
                                  ? "jibu"
                                  : "reply"
                                : lang === "sw"
                                ? "majibu"
                                : "replies"}
                            </span>
                          </button>
                        )}
                      </div>

                      {/* Inline Reply Input */}
                      {isReplying && (
                        <div className="pl-9 pt-1.5 animate-in fade-in">
                          <div className="flex items-center rounded-xl bg-sand/60 border border-line p-1">
                            <input
                              type="text"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder={
                                lang === "sw"
                                  ? `Jibu ${cmt.userName}...`
                                  : `Reply to ${cmt.userName}...`
                              }
                              className="w-full bg-transparent px-2 text-xs text-ink placeholder:text-muted outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleAddReply(cmt.id)}
                              disabled={!replyText.trim()}
                              className="px-2.5 py-1 rounded-lg bg-deep-green text-warm-white text-[10.5px] font-bold hover:bg-teal disabled:opacity-40 transition cursor-pointer"
                            >
                              {lang === "sw" ? "Tuma" : "Send"}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Nested Replies */}
                      {replies.length > 0 && isExpanded && (
                        <div className="pl-6 pt-1.5 space-y-2 border-l-2 border-line ml-3">
                          {replies.map((rep) => (
                            <div
                              key={rep.id}
                              className="rounded-xl bg-sand/30 p-2.5 space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <div className="h-5 w-5 rounded-full bg-deep-green text-[9px] font-bold text-warm-white flex items-center justify-center">
                                    {rep.userName.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-[11px] font-bold text-ink">
                                    {rep.userName}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleLikeComment(rep.id)}
                                  className="flex items-center gap-0.5 text-[9.5px] text-muted hover:text-rose-600"
                                >
                                  <Heart size={10} />
                                  <span>{rep.likes || 0}</span>
                                </button>
                              </div>
                              <p className="text-[11px] text-ink/80 leading-relaxed pl-6">
                                {rep.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

